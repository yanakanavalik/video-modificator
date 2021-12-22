import detectionResults from '../../assets/detection_result.json';

class DetectorService {
    getPositionsForTimeOffset({timeOffsetSec}) {
        const timeOffsetMS = Math.trunc(timeOffsetSec * 1000);
        const entities = detectionResults['entities'];
        const entitiesToDisplay = [];

        entities.forEach(entity => {
            const positionsForCurrentEntity = this._getEntityPositionsForTimeOffset({
                frames: entity.frames,
                timeOffsetMS,
                entity: entity.name
            });

            positionsForCurrentEntity && entitiesToDisplay.push({
                entityName: entity.name,
                positions: positionsForCurrentEntity
            });
        });

        return entitiesToDisplay;
    }

    _getEntityPositionsForTimeOffset({frames, timeOffsetMS}) {
        const currentPosition = frames.filter((entity) => {
            let timeInMS;

            if (entity['timeOffset']['ms']) {
                const tmp = timeInMS || 0;
                timeInMS = Math.trunc(entity['timeOffset']['ms']) + tmp;
            }

            if (!timeInMS) {
                return false;
            }

            return timeInMS.toString().length === timeOffsetMS.toString().length && timeInMS.toString().substr(0, 4) === timeOffsetMS.toString().substr(0, 4);
        });

        if (currentPosition.length < 1) {
            return null;
        }

        return currentPosition[0]['normalizedBoundingBox'];
    }
}

export const detectorService = new DetectorService();