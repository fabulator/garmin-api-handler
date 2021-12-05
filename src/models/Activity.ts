import { Workout, WorkoutConstructor } from 'fitness-models';
import { DateTime, Duration } from 'luxon';
import { unit } from 'mathjs';
import { ActivityType } from '../constants/activity-type';
import { Category } from '../constants/category';
import { ApiDetailApiActivity, ApiListApiActivity } from '../types/api';

interface Constructor<Id, ApiSource> extends WorkoutConstructor {
    category?: Category;
    id: Id;
    source: ApiSource;
    typeId: ActivityType;
}

type Source = ApiDetailApiActivity | ApiListApiActivity | undefined;

export default class Activity<Id extends number | undefined = any, ApiSource extends Source = any> extends Workout {
    protected id: Id;

    protected typeId: ActivityType;

    protected source: ApiSource;

    protected category: Category;

    public constructor(options: Constructor<Id, ApiSource>) {
        super(options);
        this.typeId = options.typeId;
        this.id = options.id;
        this.source = options.source;
        this.category = options.category || Category.UNCATEGORIZED;

        this.isRace = this.category === Category.RACE;
        this.isCommute = this.category === Category.TRANSPORTATION;
    }

    public static fromApi(activity: ApiDetailApiActivity): Activity<number, ApiDetailApiActivity> {
        return new Activity({
            start: DateTime.fromFormat(activity.summaryDTO.startTimeLocal, "yyyy-MM-dd'T'HH:mm:ss.0", {
                zone: activity.timeZoneUnitDTO.timeZone,
            }),
            id: activity.activityId,
            duration: Duration.fromObject({ seconds: activity.summaryDTO.duration }),
            typeId: activity.activityTypeDTO.typeKey,
            source: activity,
            distance: activity.summaryDTO.distance != null ? unit(activity.summaryDTO.distance, 'm') : undefined,
            title: activity.activityName,
            category: activity.eventTypeDTO.typeKey,
            avgHeartRate: activity.summaryDTO.averageHR,
            maxHeartRate: activity.summaryDTO.maxHR,
        });
    }

    public static fromListApi(activity: ApiListApiActivity): Activity<number, ApiListApiActivity> {
        return new Activity({
            start: DateTime.fromFormat(activity.startTimeLocal, 'yyyy-MM-dd HH:mm:ss', { zone: 'Europe/Prague' }),
            id: activity.activityId,
            duration: Duration.fromObject({ seconds: activity.duration }),
            typeId: activity.activityType.typeKey,
            source: activity,
            distance: activity.distance != null ? unit(activity.distance, 'm') : undefined,
            title: activity.activityName,
            category: activity.eventType.typeKey,
            avgHeartRate: activity.averageHR,
            maxHeartRate: activity.maxHR,
        });
    }

    protected clone(extension: Partial<Constructor<number | undefined, ApiSource>>): this {
        return new Activity({
            ...this.toObject(),
            ...extension,
        }) as this;
    }

    public getId(): Id {
        return this.id;
    }

    public setId(id: number): Activity<number, ApiSource>;

    public setId(id: undefined): Activity<undefined, ApiSource>;

    public setId(id: undefined | number): Activity<number | undefined, ApiSource> {
        return this.clone({ id });
    }

    public getTypeId() {
        return this.typeId;
    }

    public getTypeName() {
        return this.typeId;
    }

    public setTypeId(typeId: ActivityType) {
        return this.clone({ typeId });
    }

    public getSource(): ApiSource {
        return this.source;
    }

    public getCategory(): Category {
        return this.category;
    }

    public setCategory(category: Category) {
        return this.clone({ category });
    }

    public toObject(): Constructor<Id, ApiSource> {
        return {
            ...super.toObject(),
            id: this.id,
            typeId: this.typeId,
            source: this.source,
            category: this.category,
        };
    }
}
