import { DateTime, Duration } from 'luxon';
import { Activity, ActivityType } from '../../src';

describe('Test Activity class', () => {
    let activity: Activity;

    beforeEach(() => {
        activity = new Activity({
            typeId: ActivityType.WALKING,
            id: undefined,
            source: undefined,
            start: DateTime.local(),
            duration: Duration.fromMillis(100000),
        });
    });

    it('saves type id', () => {
        expect(activity.getTypeId()).toEqual('walking');
    });
});
