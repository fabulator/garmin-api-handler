import { DateTime, Duration } from 'luxon';
import { Activity } from '../../src';

describe('Test Activity class', () => {
    let activity: Activity;

    beforeEach(() => {
        activity = new Activity({
            typeId: Activity.TYPE.WALKING,
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
