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

如果要使用多源负载均衡,可以使用多个地址,用`;`号隔开

例如

`/video;https://stream.pull.workers.dev/video`

代表当前域名的和部署在`cf workers`的两个地址负载均衡

注意第一个地址始终占有更高的权重,所有地址必须都可用.



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

本项目仅作为学习使用,切勿用作其他用途

更多说明可参考

https://blog.suconghou.cn/post/mse-p2p-player/