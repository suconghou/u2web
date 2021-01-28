# u2web

支持多源多线程下载的P2P视频分享

> 支持多线程下载
> 
> 支持多源下载
> 
> CDN缓存友好,全部接口均可长缓存

下载引擎/播放引擎 https://github.com/suconghou/fastloadjs

DEMO https://video.feds.club/

## P2P说明

P2P 分享使用的信令服务器 https://github.com/suconghou/signalserver

P2P 分享使用的网络库 https://github.com/suconghou/rtc


P2P分享当在线客户端播放的是同一资源(Chrome播放的是webm,Firefox播放的是mp4),同一清晰度时才会相互分享.

## 网站里的设置说明

这些设置一般无需更改,如播放卡顿,可修改视频解析服务

**内容API服务**

资源提供接口,调用有次数限制,一般使用默认值无需修改

可用的后端项目 

https://github.com/suconghou/videoproxy

https://github.com/suconghou/u2proxyapi




**视频解析服务**

可用的后端项目

https://github.com/suconghou/videoproxy

使用cf workers 中转的 https://github.com/suconghou/u2worker

使用netlify functions 中转的 https://github.com/suconghou/netlifyworker

如果要使用多源负载均衡,可以使用多个地址,用`;`号隔开

例如

`/video;https://stream.pull.workers.dev/video`

代表当前域名的和部署在`cf workers`的两个地址负载均衡

注意第一个地址始终占有更高的权重,地址不可用后将会重试到其他地址.



**信令服务器**

一般无需修改

可用的后端项目

https://github.com/suconghou/signalserver

同一信令服务器下的用户才会相互分享

## 编译发布

注意修改 `public/index.html` `public/play.html` 中js库的版本号

然后执行 `make release`

## 组件模式

编译为组件模式

1. 修改`service/index.js`中abs变量为https绝对地址
2. 执行 `yarn buildwc`

参数
```
v: {
    type: String,
    required: true
},
level : {
    type:Number,
    default:0,
},
autoplay: {
    type: Boolean,
    default: true
},
audio: {
    type: Boolean,
    default: false
},
playlist: {
    type: [String, Array],
    default: ""
}
nop2p: {
    type: Boolean,
    default: false,
},
screenshot: {
    type: Boolean,
    default: true,
},

```

作为`web component`组件,所有参数默认均为零值,需自己按需设置值

`level` 可配置 `1` `2` `3` 对应不同权限的清晰度

`playlist`仅在`audio`模式下可用,

可取值为一个播放列表ID,或者一个数组形式为

```
[
    {
        v:'视频ID',
        title:'名称'
    }
]
```

`audio`模式需开启`autoplay`

`screenshot`截图默认开启,播放器聚焦时快捷键`s`可直接触发

`safari`不支持对`mse`的视频截图,已对其屏蔽,见`https://github.com/video-dev/hls.js/issues/1806`

因需要`MSE`的支持,移动端手机`IOS`系统(IOS13,14等)均不支持,`iPadOS 13+`支持
>
> https://stackoverflow.com/questions/52999825/why-exactly-doesnt-html5-media-source-video-work-on-ios

安卓微信支持,UC浏览器支持,手机QQ浏览器不支持.


## embed video

click `嵌入视频` below the video player , It shows you how to embed iframe or component

when use `web component`, it needs some dependencies `vue` `axios` `fastloadjs` `u2-player`

a simple example 

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* only for css reset */
        html{width:100%;height:100%;font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}body{margin:0;width:100%;height:100%;}article,aside,details,figcaption,figure,footer,header,hgroup,main,menu,nav,section,summary{display:block}audio,canvas,progress,video{display:inline-block;vertical-align:baseline}audio:not([controls]){display:none;height:0}[hidden],template{display:none}a{background-color:transparent}a:active,a:hover{outline:0}abbr[title]{border-bottom:1px dotted}b,strong{font-weight:bold}dfn{font-style:italic}h1{font-size:2em;margin:.67em 0}mark{background:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sup{top:-0.5em}sub{bottom:-0.25em}img{border:0}svg:not(:root){overflow:hidden}figure{margin:1em 40px}hr{box-sizing:content-box;height:0}pre{overflow:auto}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}button,input,optgroup,select,textarea{color:inherit;font:inherit;margin:0}button{overflow:visible}button,select{text-transform:none}button,html input[type="button"],input[type="reset"],input[type="submit"]{-webkit-appearance:button;cursor:pointer}button[disabled],html input[disabled]{cursor:default}button::-moz-focus-inner,input::-moz-focus-inner{border:0;padding:0}input{line-height:normal}input[type="checkbox"],input[type="radio"]{box-sizing:border-box;padding:0}input[type="number"]::-webkit-inner-spin-button,input[type="number"]::-webkit-outer-spin-button{height:auto}input[type="search"]{-webkit-appearance:textfield;box-sizing:content-box}input[type="search"]::-webkit-search-cancel-button,input[type="search"]::-webkit-search-decoration{-webkit-appearance:none}fieldset{border:1px solid silver;margin:0 2px;padding:.35em .625em .75em}legend{border:0;padding:0}textarea{overflow:auto}optgroup{font-weight:bold}table{border-collapse:collapse;border-spacing:0}td,th{padding:0}
        input,button,select,textarea{outline:none}textarea{resize:none}a{text-decoration:none;color:#000}ul{padding-left:0;list-style:none;}
        /* css reset end */
        .wrapper {
            width: 70%;
            margin: 10px auto;
            background: #faa;
        }
        .player-box {
            height: 0;
            padding-bottom: 59%;
            /* 最小56.25%, 稍微加大可留一些间距,看灰色底  */
            background: #aaa; /* this is only for debug view  */
        }
        .unsupport {
            text-align: center;
            padding-top: 100px;
            font-size: 16px;
            color: #f11;
        }
    </style>
</head>
<body>
    <script>
        // please set localStorage to use your own worker or videoproxy
        // localStorage.setItem("baseurl","https://your_worker_or_videoproxy_domain/video");
    </script>
    <script src="https://cdn.jsdelivr.net/combine/npm/vue@2.6.11/dist/vue.min.js,npm/axios@0.19.2/dist/axios.min.js,gh/suconghou/assets@542c436/fastload.min.js,gh/suconghou/assets@542c436/u2-player.min.js"></script>
    <div class="wrapper">
        <div class="player-box">
            <u2-player autoplay="true" nop2p="true" screenshot="true" v="9-4aWqk7b0k" id="video"></u2-player>
        </div>
    </div>
    <script>
        // optional , give message if browser too low
        var modern = window.Promise &&
            window.ReadableStream &&
            window.fetch &&
            window.ArrayBuffer &&
            window.MediaSource;

        if (!modern) {
            var el = document.getElementsByClassName('player-box')
            if (el && el.length) {
                el[0].innerHTML = '<div class="unsupport">此浏览器不支持,请更换浏览器</div>'
            }
        }
    </script>
</body>
</html>
```

**notice**

you should change `service/index.js` and `yarn buildwc` to use your own worker or videoproxy backend

or set localStorage on your website


本项目仅作为学习使用,切勿用作其他用途

更多说明可参考

https://blog.suconghou.cn/post/mse-p2p-player/