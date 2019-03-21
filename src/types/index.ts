/* eslint-disable import/export */
import { DateTime } from 'luxon';
import {
    UNCATEGORIZED,
    TRANSPORTATION,
    TRAINING,
    TOURING,
    SPECIAL_EVENT,
    RECREATIONAL,
    RACE,
    GEOCACHING,
    FITNESS,
} from '../constants/category';
import {
    UNCATEGORIZED as UNCATEGORIZED_ACTIVITY,
    SWIMMING,
    YOGA,
    WALKING,
    RUNNING,
    OTHER,
    CYCLING,
    SKATING,
    STRENGTH_TRAINING,
} from '../constants/activity-type';
import * as API_SOURCE from './api';

export declare namespace API {
    export type DetailApiActivity = API_SOURCE.DetailApiActivity;
    export type GearResponse = API_SOURCE.GearResponse;
    export type ListApiActivity = API_SOURCE.ListApiActivity;
    export type ActivityPoints = API_SOURCE.ActivityPoints;
}

export type Category = typeof UNCATEGORIZED |
    typeof TRANSPORTATION |
    typeof TRAINING |
    typeof TOURING |
    typeof SPECIAL_EVENT |
    typeof RECREATIONAL |
    typeof RACE |
    typeof GEOCACHING |
    typeof FITNESS;

export type ActivityType = typeof UNCATEGORIZED_ACTIVITY |
    typeof SWIMMING |
    typeof YOGA |
    typeof WALKING |
    typeof RUNNING |
    typeof OTHER |
    typeof CYCLING |
    typeof SKATING |
    typeof STRENGTH_TRAINING;

export interface ActivityFilters {
    limit?: number,
    startDate?: DateTime,
    endDate?: DateTime,
}
