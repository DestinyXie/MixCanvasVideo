var util = require('mix-util');

// canvas播放视频类
function CanvasVideoPlayer(options) {
    this.configs   = util.extend({
        overDelay: 0, // 结束时视频保持的时间
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
    this.androidScale = 1.095; // 隐藏播放框

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
        if (me.isIos) {
            me.loop();
        }
        me.configs.onPlay && me.configs.onPlay();
    });

    me.video.addEventListener('pause', me.videoPauseHandler = function () {
        me.playing = false;
        me.configs.onPause && me.configs.onPause();
    });

    // todo: ended事件在重新播放时触发时机不科学
    me.video.addEventListener('ended', me.videoEndHandler = function () {
        me.playing = false;
    });

    me.video.addEventListener('timeupdate', me.videoTimeUpdateHandler = me.updateTimeline.bind(this))

    if (me.timeline) {
        me.timeline.addEventListener('click', me.timelineClickHandler = me.timelineClick.bind(this));
    }
};

// 更新播放百分比，如果传入进度条则更新进度条
CanvasVideoPlayer.prototype.updateTimeline = function () {
    var me = this;
    var percentage = (me.video.currentTime * 100 / me.video.duration).toFixed(2);

    if (me.timeline) {
        me.timelinePassed.style.width = percentage + '%';
    }
    me.configs.onUpdate && me.configs.onUpdate(percentage);

    // ended
    if (percentage >= 100) {
        setTimeout(function () {
            if (!me.isIos) {
                me.video.webkitExitFullScreen && me.video.webkitExitFullScreen();
                me.video.exitFullScreen && me.video.exitFullScreen();
                me.video.style.display = 'none';
            }
            // me.clearCanvas();
            me.configs.onEnd && me.configs.onEnd();
        }, me.configs.overDelay);
    }
};

CanvasVideoPlayer.prototype.setCanvasSize = function () {
    this.width = this.configs['width'] || this.canvas.clientWidth;
    this.height = this.configs['height'] || this.canvas.clientHeight;

    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
};

CanvasVideoPlayer.prototype.play = function (isPlayPause) {
    var me = this;
    if (me.configs.videoSrc && !me.srcSeted) {
        me.video.src = me.configs.videoSrc;
        me.srcSeted = true;
    }

    if (!me.isIos) {
        me.video.style.display = 'block';

        me.video.style[util.setCssPrefix('transform')] = "scale(" + me.androidScale + ")";
        me.video.style[util.setCssPrefix('transformOrigin')] = "center center";

        // android的play方法有时候会卡住
        // me.playInter = setInterval(function () {
        //     if (me.playing) {
        //         me.played = true;
        //         clearInterval(me.playInter);
        //         return;
        //     }
        //     if (!isPlayPause && me.played) {
        //         me.video.currentTime = 0;
        //         // me.video.load();
        //     }
        //     me.video.play();
        // }, 200);
        if (!isPlayPause && me.played) {
            me.video.currentTime = 0;
            // me.video.load();
        }
        me.video.play();
    }
    else {
        if (!isPlayPause && me.played) {
            me.video.currentTime = 0;
            // me.video.load();
        }
        me.video.play();
    }

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
        this.play(true);
    }
};

CanvasVideoPlayer.prototype.stop = function () {
    this.pause();
    this.video.currentTime = 0;
    this.clearCanvas();
};

// 点击进度条调整进度，注意：进度条上层容器有zoom值时offseX的位置会有偏差
CanvasVideoPlayer.prototype.timelineClick = function (evt) {
    var offsetX = evt.offsetX;
    var percentageTime = offsetX / this.timeline.offsetWidth;

    if (percentageTime > 1) {
        percentageTime = 1;
    }
    var toCurTime = this.video.duration * percentageTime;

    this.video.currentTime = toCurTime;
};

CanvasVideoPlayer.prototype.drawFrame = function () {
    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
};

/**
 * 清空canvas
 * @param {string=} opt_color 清空默认颜色,默认黑色
 */
CanvasVideoPlayer.prototype.clearCanvas = function (opt_color) {
    this.ctx.fillStyle = opt_color || '000000';
    this.ctx.clearRect(0, 0, this.width, this.height);
};

CanvasVideoPlayer.prototype.loop = function () {
    if (this.playing) {
        this.drawFrame();
        this.animationFrame = util.nextFrame(this.loop.bind(this));
    }
    else {
        util.cancelFrame(this.animationFrame);
    }

    this.updateTimeline();
};

CanvasVideoPlayer.prototype.release = function () {
    this.video.removeEventListener('play', this.videoPlayHandler);
    this.video.removeEventListener('timeupdate', this.videoTimeUpdateHandler);
    this.video.removeEventListener('pause', this.videoPauseHandler);
    this.video.removeEventListener('ended', this.videoEndHandler);
    if (this.timeline) {
        this.timeline.removeEventListener('click', this.timelineClickHandler);
    }

    util.cancelFrame(this.animationFrame);
};

module.exports = CanvasVideoPlayer;

