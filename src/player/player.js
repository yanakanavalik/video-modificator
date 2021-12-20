export class VideoPlayer {
    constructor({videoElement}) {
        this.video = videoElement;
    }

    init() {
        const videoControls = document.getElementById('video-controls');

        // Hide the default controls
        this.video.controls = false;

        const video = this.video;

        // Display the user defined video controls
        videoControls.style.display = 'block';

        const playpause = document.getElementById('playpause');
        const stop = document.getElementById('stop');
        const mute = document.getElementById('mute');
        const volinc = document.getElementById('volinc');
        const voldec = document.getElementById('voldec');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progress-bar');
        const fullscreen = document.getElementById('fs');

        playpause.addEventListener('click', function (e) {
            if (video.paused || video.ended) video.play();
            else video.pause();
        });

        stop.addEventListener('click', function (e) {
            video.pause();
            video.currentTime = 0;
            progress.value = 0;
        });

        mute.addEventListener('click', function (e) {
            video.muted = !video.muted;
        });

        volinc.addEventListener('click', function (e) {
            alterVolume('+');
        });
        voldec.addEventListener('click', function (e) {
            alterVolume('-');
        });

        const alterVolume = function (dir) {
            const currentVolume = Math.floor(video.volume * 10) / 10;
            if (dir === '+') {
                if (currentVolume < 1) video.volume += 0.1;
            } else if (dir === '-') {
                if (currentVolume > 0) video.volume -= 0.1;
            }
        }

        video.addEventListener('loadedmetadata', function () {
            progress.setAttribute('max', video.duration);
        });

        video.addEventListener('timeupdate', function () {
            progress.value = video.currentTime;
            progressBar.style.width = Math.floor((video.currentTime / video.duration) * 100) + '%';
        });

        video.addEventListener('timeupdate', function () {
            if (!progress.getAttribute('max')) progress.setAttribute('max', video.duration);
            progress.value = video.currentTime;
            progressBar.style.width = Math.floor((video.currentTime / video.duration) * 100) + '%';
        });

        progress.addEventListener('click', function (e) {
            var rect = this.getBoundingClientRect();
            var pos = (e.pageX - rect.left) / this.offsetWidth;
            video.currentTime = pos * video.duration;
        });
    }
}