import {VideoHandler} from './video_handler';
import {VideoPlayer} from '../player/player';
import {AssetsHandler} from './assets_handler';

export const canvasHandler = {
    init: function () {
        // Init webgl and canvas
        this._initGl();

        // Load video and setup player
        this._initVideo();

        // Load image assets
        this._initAssets();
    },

    _initGl: function () {
        this.glcanvas = document.getElementById('canvas');

        this.gl = ((this.glcanvas.getContext("webgl")) || (this.glcanvas.getContext("experimental-webgl")));
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        if (this.gl && this.gl instanceof WebGLRenderingContext) {
            console.log("WebGL is available");
        } else {
            console.log("WebGL is NOT available");
        }
    },

    _initVideo: function () {
        this.video = document.getElementById('video');

        new VideoPlayer({videoElement: this.video});

        this.videoHandler = new VideoHandler({
            gl: this.gl,
            video: this.video,
        });

        const timerCallback = this._videoTimerCallback(this);

        this.videoHandler.initTimerCallback({videoTimerCallback: timerCallback});
    },

    _initAssets: function () {
        this.assetsHandler = new AssetsHandler({gl: this.gl});

        this.assetsHandler.preloadImages();
    },

    _videoTimerCallback: function (self) {
        return function () {
            // Resize canvas if it was changed
            self._resizeCanvas();

            // Process video frame update
            self.videoHandler.displayFrame();

            // Process assets update for current video time
            self.assetsHandler.drawAssets({timeOffset: self.video.currentTime});
        }
    },

    _resizeCanvas() {
        const realToCSSPixels = window.devicePixelRatio;

        const displayWidth = Math.floor(this.gl.canvas.clientWidth * realToCSSPixels);
        const displayHeight = Math.floor(this.gl.canvas.clientHeight * realToCSSPixels);

        if (this.gl.canvas.width !== displayWidth || this.gl.canvas.height !== displayHeight) {
            this.gl.canvas.width = displayWidth;
            this.gl.canvas.height = displayHeight;
        }

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }
}

