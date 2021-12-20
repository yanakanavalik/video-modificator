import results from '../../assets/result.json';

export class DetectorService {
    static getPositionsForFrame({timeOffsetSec}) {
        const timeOffsetMS = Math.trunc(timeOffsetSec * 1000);
        const entities = results['entities'];
        const currentFrames = [];

        entities.forEach(entity => {
            const positionsFromCurrentEntity = this._getPositionsFromFrames({
                frames: entity.frames,
                timeOffsetMS,
                entity: entity.name
            });

            positionsFromCurrentEntity && currentFrames.push({
                entityName: entity.name,
                positions: positionsFromCurrentEntity
            });
        });

        return currentFrames;
    }

    static _getPositionsFromFrames({frames, timeOffsetMS, entity}) {
        const currentPosition = frames.filter((entity, index) => {
            if (timeOffsetMS < 1 && !entity['timeOffset']['nanos'] && !entity['timeOffset']['seconds']) {
                return false;
            }

            let timeInMS;

            if (entity['timeOffset']['nanos'] > 0) {
                timeInMS = Math.trunc(0 + (entity['timeOffset']['nanos'] / 1000000));
            }

            if (entity['timeOffset']['seconds'] > 0) {
                const tmp = timeInMS || 0;
                timeInMS = 0 + entity['timeOffset']['seconds'] * 1000 + tmp;
            }

            if (entity['timeOffset']['ms']) {
                const tmp = timeInMS || 0;
                timeInMS = 0 + entity['timeOffset']['ms'] + tmp;
            }

            if (!timeInMS) {
                return false;
            }

            if (timeOffsetMS < 10000) {
                return timeInMS.toString().length === timeOffsetMS.toString().length && (timeInMS.toString().substr(0, 2) === timeOffsetMS.toString().substr(0, 2))
            }

            return timeInMS > 10000 && (timeInMS.toString().substr(0, 4) === timeOffsetMS.toString().substr(0, 4));
        });

        if (currentPosition.length < 1) {
            return null;
        }

        return currentPosition[0]['normalizedBoundingBox'];
    }
}