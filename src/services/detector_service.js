import results from '../../assets/result.json';
import '../../assets/result.json';

export class DetectorService {
    static getPositionsForFrame(timeOffsetSec) {
        const timeOffsetMS = Math.trunc(timeOffsetSec * 1000);
        const frames = results['entity'].frames;

        const currentPosition = frames.filter((entity, index) => {
            if (timeOffsetMS < 1 && !entity['timeOffset']['nanos'] && !entity['timeOffset']['seconds']) {
                return true;
            }

            let timeInMS;

            if (entity['timeOffset']['nanos'] > 0) {
                timeInMS = 0 + (entity['timeOffset']['nanos'] / 1000000);
            }

            if (entity['timeOffset']['seconds']) {
                timeInMS = 0 + entity['timeOffset']['seconds'] * 1000;
            }

            if (!timeInMS) {
                return false;
            }

            return timeInMS.toString()[0] === timeOffsetMS.toString()[0];
        });

        if (currentPosition.length < 1) {
            return null;
        }

        return currentPosition[0]['normalizedBoundingBox'];
    }
}