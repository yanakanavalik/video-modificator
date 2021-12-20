import {entitiesNames} from './../common';

import '../../assets/images/disney.jpeg';
import '../../assets/images/peter_pan.jpeg';
import '../../assets/images/alladin_changed.png';
import '../../assets/images/nutcracker_changed.png';
import '../../assets/images/stich.png';

const entitiesNamesToImgPaths = {
    [entitiesNames.posterAlladin]: './alladin_changed.png',
    [entitiesNames.posterDisney]: './disney.jpeg',
    [entitiesNames.posterNutcracker]: './nutcracker_changed.png',
    [entitiesNames.posterPeterPan]: './peter_pan.jpeg',
    [entitiesNames.stich]: './stich.png',
};

class ImageService {
    initiatedImages = {};

    getAllImages({width = 0, height = 0}) {
        return Object.keys(entitiesNamesToImgPaths).map(key => this.getImage({width, height, entityName: key}));
    }

    getImage({width = 0, height = 0, entityName}) {
        const img = new Image();
        img.src = entitiesNamesToImgPaths[entityName];

        if (width === 0 || height === 0) {
            this.initiatedImages[entityName] = img;
            return img;
        } else {
            img.width = width;
            img.height = height;
        }

        this.initiatedImages[entityName] = img;
        return img;
    }

    getImageData(img) {
        const canvas = document.createElement('canvas');
        canvas.setAttribute("id", "ImagePreparation");

        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        return ctx.getImageData(0, 0, img.width, img.height).data;
    }
}

export const imageService = new ImageService();