import {
    ActivityFilters as ActivityFiltersSource,
    Category as CategorySource,
    ActivityType as ActivityTypeSource,
    API as API_TYPES,
} from './types';

export { default as GarminApi } from './GarminApi';
export { Activity } from './models';
export { GarminApiException, GarminException } from './exceptions';

export declare namespace TYPES {
    export type ActivityFilters = ActivityFiltersSource;
    export type Category = CategorySource;
    export type ActivityType = ActivityTypeSource;

    namespace API {
        export type DetailApiActivity = API_TYPES.DetailApiActivity;
        export type GearResponse = API_TYPES.GearResponse;
        export type ListApiActivity = API_TYPES.ListApiActivity;
        export type ActivityPoints = API_TYPES.ActivityPoints;
    }
}
