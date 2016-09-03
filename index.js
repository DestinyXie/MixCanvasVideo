var util = require('mix-util');

// canvas播放视频类
function CanvasVideoPlayer(options) {
    this.configs   = util.extend({
        framesPerSecond: 10,
        hideVideo: true,
        width: 320,
        height: 520,
        audio: false,
        onEnd: false,
        onUpdate: false
    }, options, true);

    this.video          = this.configs.video;
    this.canvas         = this.configs.canvas;
    this.timeline       = this.configs.timeline;
    this.timelinePassed = this.configs.timelinePassed;

    if (!this.video) {
        console.error('video element is not found');
        return;
    }

    if (!this.canvas) {
        console.error('canvas element is not found');
        return;
    }

    this.ctx = this.canvas.getContext('2d');

    this.playing = false;

    this.init();
    this.bind();
}

CanvasVideoPlayer.prototype.init = function () {
    this.video.load();

    this.isIos = util.browser.versions.ios;

    if (this.isIos) {
        if (this.configs.hideVideo) {
            this.video.style.display = 'none';
        }
        this.setCanvasSize();
    }
    else {
        this.canvas.style.display = 'none';
    }
};

CanvasVideoPlayer.prototype.bind = function () {
    var me = this;

    me.video.addEventListener('play', me.videoPlayHandler = function () {
        me.playing = true;
        me.configs.onPlay && me.configs.onPlay();
    });

    me.video.addEventListener('pause', me.videoPauseHandler = function () {
        me.configs.onPause && me.configs.onPause();
    });

    me.video.addEventListener('ended', me.videoEndHandler = function () {
        if (!me.isIos) {
            me.video.webkitExitFullScreen && me.video.webkitExitFullScreen();
            me.video.exitFullScreen && me.video.exitFullScreen();
            me.video.style.display = 'none';
        }
        me.configs.onEnd && me.configs.onEnd();
    });

    me.video.addEventListener('timeupdate', me.videoTimeUpdateHandler = me.updateTimeline.bind(this))
};

// 更新播放百分比，如果传入进度条则更新进度条
CanvasVideoPlayer.prototype.updateTimeline = function () {
    var percentage = (this.video.currentTime * 100 / this.video.duration).toFixed(2);

    if (this.timeline) {
        this.timelinePassed.style.width = percentage + '%';
    }
    this.configs.onUpdate && this.configs.onUpdate(percentage);
};

CanvasVideoPlayer.prototype.setCanvasSize = function () {
    this.width = this.configs['width'] || this.canvas.clientWidth;
    this.height = this.configs['height'] || this.canvas.clientHeight;

    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
};

CanvasVideoPlayer.prototype.play = function () {
    var me = this;
    if (me.configs.videoSrc && !me.srcSeted) {
        me.video.src = me.configs.videoSrc;
        me.srcSeted = true;
    }

    if (!me.isIos) {
        me.video.style.display = 'block';
    }
    else {
        me.loop();
    }

    // android的play方法有时候会卡住
    me.playInter = setInterval(function () {
        if (me.playing) {
            clearInterval(me.playInter);
            return;
        }
        me.video.play();
    }, 100);


    // audio todo
};

CanvasVideoPlayer.prototype.pause = function () {
    this.playing = false;
    this.video.pause();
    // audio todo
};

CanvasVideoPlayer.prototype.playPause = function () {
    if (this.playing) {
        this.pause();
    }
    else {
        this.play();
    }
};

CanvasVideoPlayer.prototype.drawFrame = function () {
    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
};

CanvasVideoPlayer.prototype.loop = function () {
    var me = this;
    if (me.playing) {
        me.drawFrame();
        me.animationFrame = util.nextFrame(function(){
            me.loop();
        });
    }
    else {
        util.cancelFrame(me.animationFrame);
    }

    me.updateTimeline();
};

CanvasVideoPlayer.prototype.release = function () {
    this.video.removeEventListener('play', this.videoPlayHandler);
    this.video.removeEventListener('timeupdate', this.videoTimeUpdateHandler);
    this.video.removeEventListener('pause', this.videoPauseHandler);
    this.video.removeEventListener('ended', this.videoEndHandler);

    util.cancelFrame(this.animationFrame);
};

module.exports = CanvasVideoPlayer;