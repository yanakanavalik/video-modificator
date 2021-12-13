import '../../assets/man.png';

export class ImageService {
    static imagePath = './man.png';

    static getImage({width = 0, height = 0}) {
        const img = new Image();
        img.src = this.imagePath;
        if (width === 0 || height === 0) {
            return img;
        } else {
            img.width = width;
            img.height = height;
        }

        return img;
    }

    static getImageData(img) {
        const canvas = document.createElement('canvas');
        canvas.setAttribute("id", "ImagePreparation");

        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        return ctx.getImageData(
            0, 0, img.width, img.height
        ).data;
    }
}