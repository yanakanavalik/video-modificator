import {DetectorService} from "./services/detector_service";
import {ImageService} from './services/image_service';

export const canvasHandler = {
        timerCallback: function () {
            if (this.video.paused || this.video.ended) {
                return;
            }
            this.computeFrame();

            let self = this;
            setTimeout(function () {
                self.timerCallback();
            }, 0);
        },

        doLoad: function () {
            this.video = document.getElementById("video");
            this.c1 = document.getElementById("c1");
            this.ctx1 = this.c1.getContext("2d");
            let self = this;

            this.video.addEventListener("play", function () {
                self.width = self.video.videoWidth / 10;
                self.height = self.video.videoHeight / 10;
                self.timerCallback();
            }, false);
        },

        computeFrame: function () {
            this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);

            let frame = this.ctx1.getImageData(0, 0, this.width, this.height);

            const positions = DetectorService.getPositionsForFrame(this.video.currentTime);

            if (positions === undefined || positions === null) {
                return false;
            }

            const frameWidth = frame.width;
            const frameHeight = frame.height;

            const x = (positions.left || 0) * frameWidth;
            const y = (positions.top  || 0)* frameHeight;

            const x1 = (positions.right || 0) * frameWidth;
            const y1 = (positions.bottom  || 0) * frameHeight;

            const dirtyWidth = x1 - x;
            const dirtyHeight = y1 - y;

            const img = ImageService.getImage({width: frameWidth, height: frameHeight});

            this.ctx1.drawImage(img, x, y, dirtyWidth, dirtyHeight);
        },
    }
;




