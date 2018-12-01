import { DateTime, Duration } from 'luxon';
import { Workout, TYPES } from 'fitness-models';
import { unit, Unit } from 'mathjs';
import * as CATEGORY from '../constants/category';
import * as TYPE from '../constants/activity-type';
import { API, Category, ActivityType } from '../types';

interface Constructor<Id, ApiSource> extends TYPES.WorkoutConstructor {
    typeId: ActivityType,
    id: Id,
    source: ApiSource,
    category?: Category,
}

type Source = (API.DetailApiActivity | API.ListApiActivity | undefined);

export default class Activity<Id extends (number | undefined) = any, ApiSource extends Source = any> extends Workout {
    protected id: Id;

    protected typeId: ActivityType;

    protected source: ApiSource;

    protected category: Category;

    public constructor(options: Constructor<Id, ApiSource>) {
        super(options);
        this.typeId = options.typeId;
        this.id = options.id;
        this.source = options.source;
        this.category = options.category || 'uncategorized';

        this.isRace = this.category === 'race';
        this.isCommute = this.category === 'transportation';
    }

    public static CATEGORY = CATEGORY;

    public static TYPE = TYPE;

    public static fromApi(activity: API.DetailApiActivity): Activity<number, API.DetailApiActivity> {
        return new Activity({
            start: DateTime.fromFormat(
                activity.summaryDTO.startTimeLocal,
                'yyyy-MM-dd HH:mm:ss',
                { zone: activity.timeZoneUnitDTO.timeZone },
            ),
            id: activity.activityId,
            duration: Duration.fromObject({ seconds: activity.summaryDTO.duration }),
            typeId: activity.activityTypeDTO.typeKey,
            source: activity,
            distance: unit(activity.summaryDTO.distance, 'm'),
            title: activity.activityName,
            category: activity.eventTypeDTO.typeKey,
            avgHeartRate: activity.summaryDTO.averageHR,
            maxHeartRate: activity.summaryDTO.maxHR,
        });
    }

    public static fromListApi(activity: API.ListApiActivity): Activity<number, API.ListApiActivity> {
        return new Activity({
            start: DateTime.fromFormat(
                activity.startTimeLocal,
                'yyyy-MM-dd HH:mm:ss',
                { zone: 'Europe/Prague' },
            ),
            id: activity.activityId,
            duration: Duration.fromObject({ seconds: activity.duration }),
            typeId: activity.activityType.typeKey,
            source: activity,
            distance: unit(activity.distance, 'm'),
            title: activity.activityName,
            category: activity.eventType.typeKey,
            avgHeartRate: activity.averageHR,
            maxHeartRate: activity.maxHR,
        });
    }

    protected clone(extension: Partial<Constructor<number | undefined, ApiSource>>): any {
        return new Activity({
            ...this.toObject(),
            ...extension,
        });
    }

    public getId(): Id {
        return this.id;
    }

    public setId(id: number): Activity<number, ApiSource>

    public setId(id: undefined): Activity<undefined, ApiSource>

    public setId(id: number | undefined) {
        return this.clone({ id });
    }

    public getTypeId() {
        return this.typeId;
    }

    public getTypeName() {
        return this.typeId;
    }

    public setTypeId(typeId: ActivityType): Activity<Id, ApiSource> {
        return this.clone({ typeId });
    }

    public getSource(): ApiSource {
        return this.source;
    }

    public getCategory(): Category {
        return this.category;
    }

    public setCategory(category: Category): Activity<Id, ApiSource> {
        return this.clone({ category });
    }

    public setStart(start: DateTime): Activity<Id, ApiSource> {
        return this.clone({ start });
    }

    public setDuration(duration: Duration): Activity<Id, ApiSource> {
        return this.clone({ duration });
    }

    public setDistance(distance?: Unit): Activity<Id, ApiSource> {
        return this.clone({ distance });
    }

    public setCalories(calories?: number): Activity<Id, ApiSource> {
        return this.clone({ calories });
    }

    public setNotes(notes?: string): Activity<Id, ApiSource> {
        return this.clone({ notes });
    }

    public setAvgHeartRate(avgHeartRate?: number): Activity<Id, ApiSource> {
        return this.clone({ avgHeartRate });
    }

    public setMaxHeartRate(maxHeartRate?: number): Activity<Id, ApiSource> {
        return this.clone({ maxHeartRate });
    }

    public setTitle(title?: string): Activity<Id, ApiSource> {
        return this.clone({ title });
    }

    public setAscent(ascent?: Unit): Activity<Id, ApiSource> {
        return this.clone({ ascent });
    }

    public setDescent(descent?: Unit): Activity<Id, ApiSource> {
        return this.clone({ descent });
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
