全屏播放视频，ios使用canvas，android使用全屏api

## Installation

    npm install mix-canvas-video

## Usage

```js
var CanvasVideoPlayer = require('mix-canvas-video');
var video1player =  new CanvasVideoPlayer({
    video: xxx, // video dom元素
    canvas: xxx, // canvas dom元素
    timeline: xxx, // 进度条dom元素，可选
    timelinePassed: xxx, // 进度条内部元素，可选
    onPlay: [Funciton], // 播放开始回调，可选
    onPause: [Funciton], // 播放暂停回调，可选
    onEnd: [Funciton], // 播放结束回调，可选
    onUpdate: function (percent) { // 进度百分比回调，可选
        console.log(percent);
    }
});
```

## License
<a href="http://nate.mit-license.org">MIT</a>