import { DefaultResponseProcessor } from 'rest-api-handler';
import CookieApi from 'cookie-api-handler';
import * as FormData from 'form-data';
import GarminApiException from './exceptions/GarminApiException';
import Activity from './models/Activity';
import { ActivityFilters, API } from './types';
import responseDecoder from './helpers/responseDecoder';

export default class GarminApi extends CookieApi<any> {
    protected session?: string;

    public constructor(session?: string) {
        super('https://connect.garmin.com/modern/proxy', [
            new DefaultResponseProcessor(GarminApiException, responseDecoder),
        ], {
            nk: 'NT',
            'Content-Type': 'application/json',
        });

        this.session = session;

        this.addCookies({
            _gid: 'X',
        });
    }

    public setSession(session?: string): this {
        this.session = session;
        this.addCookies({ SESSIONID: session || '' });
        return this;
    }

    public getSession(): string | undefined {
        return this.session;
    }

    public async login(email: string, password: string): Promise<string> {
        // get ticket from login form
        const { data } = await this.post('https://sso.garmin.com/sso/login?service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F', {
            username: email,
            password,
            embed: false,
        }, CookieApi.FORMATS.URL_ENCODED, {
            'Content-Type': 'application/x-www-form-urlencoded',
        });

        const ticket = /ticket=(([a-zA-Z]|-|\d)*)/g.exec(data);

        // if ticket is no present, there is some error in html
        if (!ticket) {
            const errorMessage = /<div id="status" class="error">([a-zA-Z]| |\.)*<\/div>/g.exec(data);
            throw new Error(errorMessage ? errorMessage[1] : 'Error in Login. Cannot find ticket.');
        }

        // use ticket
        try {
            await this.request(`?${ticket[0]}`, 'GET', {
                redirect: 'manual',
            });
            // eslint-disable-next-line no-empty
        } catch (exception) {}

        // this will load cookies
        await this.get('https://connect.garmin.com/modern/');

        const cookies = this.getCookies();

        if (!cookies) {
            throw new Error('Login failed. Cookies were not loaded.');
        }

        this.setSession(cookies.SESSIONID);

        return cookies.SESSIONID;
    }

    public async getActivity(id: number): Promise<Activity> {
        const { data } = await this.get(`activity-service/activity/${id}`);
        return Activity.fromApi(data);
    }

    public async getPoints(id: number): Promise<API.ActivityPoints> {
        const { data } = await this.get(`activity-service/activity/${id}/details`);
        return data;
    }

    public async getActivityGpx(id: number): Promise<string> {
        const { data } = await this.get(`download-service/export/gpx/activity/${id}`);
        return data;
    }

    public async getActivities(filter: ActivityFilters): Promise<Array<Activity>> {
        const { startDate, endDate } = filter;

        const { data } = await this.get('activitylist-service/activities/search/activities', {
            ...filter,
            ...(startDate ? { starDate: startDate.toSQLDate() } : {}),
            ...(endDate ? { endDate: endDate.toSQLDate() } : {}),
        });

        return data.map((activity: API.ListApiActivity) => {
            return Activity.fromListApi(activity);
        });
    }

    public async uploadGpx(gpx: string): Promise<number> {
        const form = new FormData();

        form.append('file', gpx, {
            filename: 'activity.gpx',
            contentType: 'application/octet-stream',
        });

        const headers = this.getDefaultHeaders();

        this.setDefaultHeaders({
            cookie: headers.cookie,
            nk: headers.nk,
        });
        // @ts-ignore
        const response = await this.request('upload-service/upload/.gpx', 'POST', {
            body: form,
        });
        this.setDefaultHeaders(headers);

        return response.data.detailedImportResult.successes[0].internalId;
    }

    public async createActivity(activity: Activity<undefined, undefined>) {
        return this.activityUpdater(activity);
    }

    public async updateActivity(activity: Activity<number>) {
        return this.activityUpdater(activity);
    }

    protected async activityUpdater(activity: Activity<number | undefined>): Promise<Activity<number>> {
        const distance = activity.getDistance();
        const averageHR = activity.getAvgHeartRate();
        const maxHR = activity.getMaxHeartRate();

        const { data } = await this.post(`activity-service/activity/${activity.getId() || ''}`, {
            activityName: activity.getTitle() || activity.getTypeId(),
            activityTypeDTO: {
                typeKey: activity.getTypeId(),
            },
            summaryDTO: {
                duration: activity.getDuration().as('seconds'),
                startTimeLocal: `${activity.getStart().toISO({ includeOffset: false, suppressMilliseconds: true })}.0`,
                ...(averageHR != null ? { averageHR } : {}),
                ...(maxHR != null ? { maxHR } : {}),
                ...(distance != null ? { distance: distance.toNumber('m') } : {}),
            },
            eventTypeDTO: {
                typeKey: activity.getCategory(),
            },
            timeZoneUnitDTO: {
                unitKey: 'Europe/Prague',
            },
            ...(activity.getId() ? { activityId: activity.getId() } : {}),
        }, CookieApi.FORMATS.JSON, {
            ...(activity.getId() ? { 'x-http-method-override': 'PUT' } : {}),
        });

        // @ts-ignore
        return activity.getId() ? activity : Activity.fromApi(data);
    }

    public async addGear(activityId: number, gear: string): Promise<API.GearResponse> {
        const { data } = await this.post(`gear-service/gear/link/${gear}/activity/${activityId}`, {

        }, CookieApi.FORMATS.JSON, {
            'x-http-method-override': 'PUT',
        });

        return data;
    }
}
