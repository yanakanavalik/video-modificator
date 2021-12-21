import {entitiesNames} from '../common/entities_names';

import '../../assets/images/disney_changed.png';
import '../../assets/images/peter_pan_changed.png';
import '../../assets/images/alladin_changed.png';
import '../../assets/images/nutcracker_changed.png';
import '../../assets/images/stich.png';

const entitiesNamesToImgPaths = {
    [entitiesNames.posterAlladin]: './alladin_changed.png',
    [entitiesNames.posterDisney]: './disney_changed.png',
    [entitiesNames.posterNutcracker]: './nutcracker_changed.png',
    [entitiesNames.posterPeterPan]: './peter_pan_changed.png',
    [entitiesNames.stich]: './stich.png',
};

class ImageService {
    loadedImages = {};

    loadAllImages({width = 0, height = 0}) {
        return Object.keys(entitiesNamesToImgPaths).map(key => this._loadImage({width, height, entityName: key}));
    }

    _loadImage({width = 0, height = 0, entityName}) {
        const img = new Image();
        img.src = entitiesNamesToImgPaths[entityName];

        if (width === 0 || height === 0) {
            this.loadedImages[entityName] = img;
            return img;
        } else {
            img.width = width;
            img.height = height;
        }

        this.loadedImages[entityName] = img;
        return img;
    }
}

export const imageService = new ImageService();