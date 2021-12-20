class PointsPicker {
    constructor() {
        this.pointsSelectEl = document.getElementById('points-select');
        this.pointsSelected = JSON.parse(localStorage.getItem('pointsSelected') || '[]');

        if (this.pointsSelected.length) {
            this.pointsSelectEl.value = this.pointsSelected.length;
        } else {
            this._createPoints(1);
        }

        this.pointsSelectEl.addEventListener('change', () => {
            this._createPoints(Number(this.pointsSelectEl.value));
            this._renderPoints();
        });

        this._renderPoints();
    }

    _createPoints(count) {
        this.pointsSelected = [];

        for (let i = 0; i < count; i++) {
            this.pointsSelected.push({
                id: i,
                color: Math.floor(Math.random() * 16777215).toString(16),
            })
        }

        localStorage.setItem('pointsSelected', JSON.stringify(this.pointsSelected));
        this._onPointsUpdated(this.points);
    }

    _renderPoints() {
        let el = document.getElementById('points-info');
        el.innerHTML = '';

        this.pointsSelected.forEach(point => {
            let row = document.createElement('div');
            row.textContent = point.id + ':';

            let input = document.createElement('input');
            input.disabled = true;
            input.type = 'color';
            input.value = '#' + point.color;

            row.appendChild(input);
            el.appendChild(row);
        });
    }

    get points() {
        return this.pointsSelected;
    }

    onPointsUpdated(callback) {
        this._onPointsUpdated = callback;
    }
}

class Controls {
    constructor(props) {
        this._onSubmit = () => {
        };

        this.input = document.getElementById('input');
        this.btnPause = document.getElementById('btn-pause');
        this.btnPlay = document.getElementById('btn-play');

        this.btnLoad = document.getElementById('btn-load');

        this.input.value = localStorage.getItem('url');

        this._pointsPicker = new PointsPicker()

        this.btnLoad.addEventListener('click', () => {
            localStorage.setItem('url', this.input.value);

            this._onSubmit(this.input.value);
        })

        this.btnPause.addEventListener('click', () => this._onPause());
        this.btnPlay.addEventListener('click', () => this._onPlay());
    }

    onSpacePressed(cb) {
        document.addEventListener('keypress', e => {
            if (e.code === 'Space') {
                cb();
            }
        })
    }

    showPlaybackControls() {
        this.btnPause.style.display = 'inline-block';
        this.btnPlay.style.display = 'inline-block';
    }

    onSubmit(cb) {
        this._onSubmit = cb;
    }

    onPauseClicked(cb) {
        this._onPause = cb;
    }

    onPlayClicked(cb) {
        this._onPlay = cb;
    }

    get pointsPicker() {
        return this._pointsPicker;
    }
}

class Player {
    constructor() {
        this.mainVideo = document.getElementById('main-video');
        const {
            x,
            y,
        } = this.mainVideo.getBoundingClientRect();

        this.leftOffset = x;
        this.topOffset = y;
    }

    load(src) {
        this.mainVideo.src = src;

        this.mainVideo.addEventListener('loadeddata', () => {
            this._onLoad();
        })
    }

    play() {
        this.mainVideo.play();
    }

    pause() {
        this.mainVideo.pause();
    }

    onLoad(cb) {
        this._onLoad = cb;
    }

    onMouseMove(callback) {
        this.mainVideo.addEventListener('mousemove', e => {
            callback(
                e.clientX - this.leftOffset,
                e.clientY - this.topOffset,
            )
        });
    }

    onClick(cb) {
        this.mainVideo.addEventListener('click', cb);
    }

    nextFrame() {
        this.mainVideo.play();
        setTimeout(() => {
            this.mainVideo.pause();
        }, 1000 / 64);
    }

    getTimeOffset() {
        return this.mainVideo.currentTime * 1000;
    }
}

class CapturePoints {
    constructor(baseWidth, baseHeight, points) {
        this.overlay = document.getElementById('dots-overlay');
        this.points = points;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this._activePointIndex = 0;

        this._pointsData = {};
        this.allPointsSet = false;

        this.data = [];
    }

    updatePointsSettings(points) {
        this.points = points;
    }

    handeClick() {
        debugger
        if (this._activePointIndex === this.points.length) {
            this._updatePointsData({});
            this._activePointIndex = 0;
            this.allPointsSet = false;
            this.overlay.innerHTML = '';
        }

        let currentPointIndex = this._activePointIndex++;
        this._pointsData[this.points[currentPointIndex].id] = {x: this.xPosition, y: this.yPosition}
        this._drawPoint(currentPointIndex);

        if (this._activePointIndex === this.points.length) {
            this.allPointsSet = true;
        }
    }

    _drawPoint(index) {
        let pointSettings = this.points[index];

        let el = document.createElement('div')
        el.classList.add('dot');
        el.style.backgroundColor = '#' + pointSettings.color;

        el.style.left = this._pointsData[pointSettings.id].x * this.baseWidth + 'px'
        el.style.top = this._pointsData[pointSettings.id].y * this.baseHeight + 'px'

        this.overlay.appendChild(el);
    }

    _updatePointsData(data) {
        this._pointsData = data;
    }

    updateMousePosition(x, y) {
        const normalizedX = x / this.baseWidth;
        const normalizedY = y / this.baseHeight;

        this.xPosition = normalizedX;
        this.yPosition = normalizedY;
    }

    capture(timeOffset) {
        if (!this.allPointsSet) {
            return alert('Data not recorded. Epected: ' + this.points.length + ' to be set');
        }

        this.data.push({
            coords: {...this._pointsData},
            timeOffset: timeOffset,
        });

        console.clear();
        console.log(this.data);
    }
}


// MAIN
const controls = new Controls();
const player = new Player();
const capturePoints = new CapturePoints(640, 360, controls.pointsPicker.points);

controls.onSubmit((url) => {
    player.load(url);
})
controls.onPauseClicked(() => {
    player.pause();
})
controls.onPlayClicked(() => {
    player.play();
})

controls.onSpacePressed(() => {
    capturePoints.capture(player.getTimeOffset());
    player.nextFrame();
})

controls.pointsPicker.onPointsUpdated(points => {
    capturePoints.updatePointsSettings(points);
})

player.onLoad(() => {
    controls.showPlaybackControls();

    player.onMouseMove((x, y) => {
        capturePoints.updateMousePosition(x, y);
    })

    player.onClick(() => {
        capturePoints.handeClick();
    })
})