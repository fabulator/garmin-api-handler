import CookieApi from 'cookie-api-handler';
import FormData from 'form-data';
import { DateTime } from 'luxon';
import { DefaultResponseProcessor } from 'rest-api-handler';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { GarminConnect } from 'garmin-connect';
import GarminApiException from './exceptions/GarminApiException';
import responseDecoder from './helpers/responseDecoder';
import Activity from './models/Activity';
import { ApiActivityPoints, ApiDetailApiActivity, ApiGearResponse, ApiListApiActivity } from './types/api';

export interface ActivityFilters {
    endDate?: DateTime;
    limit?: number;
    startDate?: DateTime;
}

export default class GarminApi extends CookieApi<any> {
    protected session?: string;

    public constructor(session?: string) {
        super('https://connect.garmin.com/modern/proxy', [new DefaultResponseProcessor(GarminApiException, responseDecoder)], {
            'nk': 'NT',
            'Content-Type': 'application/json',
            'dnt': '1',
            'origin': 'https://connect.garmin.com',
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
        const GCClient = new GarminConnect();

        await GCClient.login(email, password);

        const { cookies } = GCClient.client.cookies._jar.toJSON();

        const session = cookies.find((item: any) => item.key === 'SESSIONID' && item.domain === 'connect.garmin.com').value;
        const __cflb = cookies.find((item: any) => item.key === '__cflb' && item.domain === 'connect.garmin.com').value;

        this.setSession(session);

        this.addCookies({ __cflb });

        return session;

        // does not pass clouflare protection
        /*
        // get ticket from login form
        const { data } = await this.post(
            'https://sso.garmin.com/sso/login?service=https%3A%2F%2Fconnect.garmin.com%2Fmodern%2F',
            {
                username: email,
                password,
                embed: false,
            },
            CookieApi.FORMATS.URL_ENCODED,
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://sso.garmin.com/sso/signin',
            },
        );

        const ticket = /ticket=(([A-Za-z]|-|\d)*)/g.exec(data);

        // if ticket is no present, there is some error in html
        if (!ticket) {
            const errorMessage = /<div id="status" class="error">([A-Za-z]| |\.)*<\/div>/g.exec(data);
            throw new Error(errorMessage ? errorMessage[1] : 'Error in Login. Cannot find ticket.');
        }

        // use ticket
        try {
            await this.request(`?${ticket[0]}`, 'GET', {
                redirect: 'manual',
            });
            // eslint-disable-next-line no-empty
        } catch {}

        // this will load cookies
        await this.get('https://connect.garmin.com/modern/');

        const cookies = this.getCookies();

        if (!cookies) {
            throw new Error('Login failed. Cookies were not loaded.');
        }

        this.setSession(cookies.SESSIONID);

        return cookies.SESSIONID; */
    }

    public async getActivity(id: number): Promise<Activity<number, ApiDetailApiActivity>> {
        const { data } = await this.get(`activity-service/activity/${id}`);
        return Activity.fromApi(data);
    }

    public async getPoints(id: number): Promise<ApiActivityPoints> {
        const { data } = await this.get(`activity-service/activity/${id}/details`);
        return data;
    }

    public async getActivityGpx(id: number): Promise<string> {
        const { data } = await this.get(`download-service/export/gpx/activity/${id}`);
        return data;
    }

    public async getActivityFile(id: number): Promise<Blob> {
        const { data } = await this.get(`download-service/files/activity/${id}`);
        return data;
    }

    public async getActivities(filter: ActivityFilters): Promise<Activity[]> {
        const { startDate, endDate } = filter;

        const { data } = await this.get('activitylist-service/activities/search/activities', {
            ...filter,
            ...(startDate ? { starDate: startDate.toSQLDate() } : {}),
            ...(endDate ? { endDate: endDate.toSQLDate() } : {}),
        });

        return data.map((activity: ApiListApiActivity) => {
            return Activity.fromListApi(activity);
        });
    }

    public logWeight(date: DateTime, kg: number) {
        return this.post('weight-service/user-weight', {
            gmtTimestamp: date.setZone('UTC').toISO({ includeOffset: false }),
            dateTimestamp: date.toISO({ includeOffset: false }),
            unitKey: 'kg',
            value: kg,
        });
    }

    public async upload(fileContent: string | Buffer, format: 'gpx' | 'fit'): Promise<number> {
        const form = new FormData();

        form.append('file', fileContent, {
            filename: `activity.${format}`,
            contentType: 'application/octet-stream',
        });

        const headers = this.getDefaultHeaders();

        this.setDefaultHeaders({
            cookie: headers.cookie,
            nk: headers.nk,
        });

        const response = await this.request(`upload-service/upload/.${format}`, 'POST', {
            body: form as any,
        });

        this.setDefaultHeaders(headers);

        return response.data.detailedImportResult.successes[0].internalId;
    }

    public async uploadGpx(gpx: string): Promise<number> {
        return this.upload(gpx, 'gpx');
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

        const { data } = await this.post(
            `activity-service/activity/${activity.getId() || ''}`,
            {
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
                description: activity.getNotes(),
                ...(activity.getId() ? { activityId: activity.getId() } : {}),
            },
            CookieApi.FORMATS.JSON,
            {
                ...(activity.getId() ? { 'x-http-method-override': 'PUT' } : {}),
            },
        );

        return activity.getId() ? (activity as Activity<number>) : Activity.fromApi(data);
    }

    public async addGear(activityId: number, gear: string): Promise<ApiGearResponse> {
        const { data } = await this.post(`gear-service/gear/link/${gear}/activity/${activityId}`, {}, CookieApi.FORMATS.JSON, {
            'x-http-method-override': 'PUT',
        });

        return data;
    }

    public async getGears(activityId: number): Promise<ApiGearResponse[]> {
        const { data } = await this.get(`gear-service/gear/filterGear?activityId=${activityId}`);
        return data;
    }
}
