import './../../assets/images/player_controls/play.svg';
import './../../assets/images/player_controls/pause.svg';
import './../../assets/images/player_controls/sound-on.svg';
import './../../assets/images/player_controls/sound-off.svg';
import './../../assets/images/player_controls/plus.svg';
import './../../assets/images/player_controls/minus.svg';
import './../../assets/images/player_controls/stop.svg';

export class VideoPlayer {
    constructor({videoElement}) {
        this.video = videoElement;

        this.init();
    }

    init() {
        const videoControls = document.getElementById('video-controls');

        // Hide the default controls
        this.video.controls = false;

        const video = this.video;

        // Display the user defined video controls
        videoControls.style.display = 'flex';
        video.playbackRate = 1.0;

        const playpause = document.getElementById('playpause');
        const stop = document.getElementById('stop');
        const mute = document.getElementById('mute');
        const volinc = document.getElementById('volinc');
        const voldec = document.getElementById('voldec');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progress-bar');
        const playbackRate = document.getElementById('playbackRate');
        const playpauseImage = document.getElementById('playpause').firstChild;
        const muteImage = document.getElementById('mute').firstChild;

        playpause.addEventListener('click', function (e) {
            if (video.paused || video.ended) {
                playpauseImage.src = 'pause.svg';
                video.play();
            } else {
                playpauseImage.src = 'play.svg';
                video.pause();
            }
        });

        stop.addEventListener('click', function (e) {
            video.pause();
            playpauseImage.src = 'play.svg';
            video.currentTime = 0;
            progress.value = 0;
        });

        mute.addEventListener('click', function (e) {
            if (video.muted) {
                muteImage.src = 'sound-on.svg';
            } else {
                muteImage.src = 'sound-off.svg';
            }

            video.muted = !video.muted;
        });

        volinc.addEventListener('click', function (e) {
            alterVolume('+');
        });

        voldec.addEventListener('click', function (e) {
            alterVolume('-');
        });

        playbackRate.addEventListener('click', function (e) {
            const currentPlaybackRate = video.playbackRate;
            let newRate = currentPlaybackRate + 0.5 > 2.0 ? 0.5 : currentPlaybackRate + 0.5;

            if (newRate.toString().length === 1) {
                newRate = newRate + '.0';
            }

            video.playbackRate = newRate;
            playbackRate.innerText = newRate;
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