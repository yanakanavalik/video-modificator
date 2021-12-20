class Controls {
    constructor(props) {
        this._onSubmit = () => {};

        this.input = document.getElementById('input');
        this.btnLoad = document.getElementById('btn-load');
        this.playbackSpeedEl = document.getElementById('playback-speed');

        this.input.value = localStorage.getItem('url');
        this.playbackSpeedEl.value = localStorage.getItem('playbackSpeed');

        this.btnLoad.addEventListener('click', () => {
            localStorage.setItem('url', this.input.value);

            if (!this.playbackSpeedEl.value) {
                this.playbackSpeedEl.value = 1;
            }

            localStorage.setItem('playbackSpeed', this.playbackSpeedEl.value);

            this._onSubmit(this.input.value);
        })
    }

    get playbackSpeed () {
        return Number(this.playbackSpeedEl.value) || 1;
    }

    setButtonColor(color) {
        this.btnLoad.style.backgroundColor = color;
    }

    onSubmit(cb) {
        this._onSubmit = cb;
    }
}

class Player {
    constructor({ speed, fps }) {
        this.mainVideo = document.getElementById('main-video');
        this.speed = speed;
        this.fps = fps;
    }

    load (src) {
        this.mainVideo.src = src;
        this.mainVideo.playbackRate = this.speed;

        this.mainVideo.addEventListener('loadeddata', () => {
            this._onLoad();
            this.mainVideo.play();
        })
    }

    onLoad(cb) {
        this._onLoad = cb;
    }

    onMouseMove(callback) {
        let topOffset = this.mainVideo.offsetTop;
        let leftOffset = this.mainVideo.offsetLeft;
        this.mainVideo.addEventListener('mousemove', e => {
            callback(
                e.clientX - leftOffset,
                e.clientY - topOffset,
            )
        });
    }

    perFrame(cb) {
        let interval = 1000 / this.fps / this.speed;
        console.log('%cFrame interval', 'background-color: #f00', interval);

        setInterval(cb, interval);
    }

    setSpeed(playbackSpeed) {
        this.speed = playbackSpeed;
    }
}

class CapturePosition {
    constructor(baseWidth, baseHeight, playbackSpeed) {
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;

        this._onRecordingStarted = () => {};
        this._onRecordingEnded = () => {};

        this.isRecoding = false;

        this.data = [];
    }

    onRecordingStarted(cb) {
        this._onRecordingStarted = cb;
    }

    onRecordingEnded(cb) {
        this._onRecordingEnded = cb;
    }

    startRecording () {
        this._onRecordingStarted();
    }
    endRecording () {
        this._onRecordingEnded();

        console.log(this.data);

        this.data = [];
    }

    initListeners() {
        document.addEventListener('click', () => {
            if (this.isRecoding) {
                this.endRecording()
            } else {
                this.startRecording();
            }

            this.isRecoding = !this.isRecoding;
        })
    }

    capturePosition() {
        if (!this.isRecoding) {
            return
        }

        this.data.push({
            left: this.xPosition,
            top: this.yPosition,
        })
    }

    updateMouse(x, y) {
        const normalizedX = x / this.baseWidth;
        const normalizedY = y / this.baseHeight;

        this.xPosition = normalizedX;
        this.yPosition = normalizedY;
    }
}

const controls = new Controls();
const player = new Player({
    speed: 1, //default value
    fps: 64, // frames per seconds
});
const capturePosition = new CapturePosition(640, 360);

capturePosition.onRecordingStarted(() => {
    controls.setButtonColor('red');
})
capturePosition.onRecordingEnded(() => {
    controls.setButtonColor(null);
})

controls.onSubmit((url) => {
    player.setSpeed(controls.playbackSpeed);
    player.load(url);
})

player.onLoad(() => {
    capturePosition.initListeners();

    player.perFrame(() => {
        console.log('frame!');
        capturePosition.capturePosition()
    })

    player.onMouseMove((x, y) => {
        capturePosition.updateMouse(x, y);
    });
})




