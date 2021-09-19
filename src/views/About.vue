<template>
	<div class="about-inner">
		<mu-container>
			<mu-card>
				<div class="about-c">
					<p>本项目仅作为学习使用,切勿用作其他用途</p>
					<p>如果你觉得有用,请Star</p>

					<h2>前端:</h2>
					<h4>WEBUI</h4>
					<p>
						Vue + Vue-Router + axios + muse-ui
						<br />
						<a href="https://github.com/suconghou/u2web">https://github.com/suconghou/u2web</a>
					</p>

					<h4>Loader</h4>
					<p>
						一开始是一个多线程下载器,后来加入了Media Source Extensions,成为一个Dash Player引擎
						<br />再后来融入了P2P下载
						<br />
						<a href="https://github.com/suconghou/fastloadjs">https://github.com/suconghou/fastloadjs</a>
					</p>

					<h4>P2P引擎</h4>
					<p>
						基于Webrtc构建的网格型P2P网络库,不是1对1,而是多对多,需要信令服务器
						<br />
						<a href="https://github.com/suconghou/libwebrtc">https://github.com/suconghou/libwebrtc</a>
					</p>
					<h4>SIDX和EBML解析</h4>
					<p>
						从mp4和webm视频文件中分析seek索引,为分片提供支持
						<br />
						<a href="https://github.com/suconghou/mediaparse">https://github.com/suconghou/mediaparse</a>
					</p>

					<h2>后端:</h2>
					<h4>第一个GO语言版本</h4>
					<p>
						最开始使用Go语言编写的,全功能版本,包含视频解析和资源API
						<br />
						<a href="https://github.com/suconghou/videoproxy">https://github.com/suconghou/videoproxy</a>
					</p>
					<h4>GO写的视频解析库</h4>
					<p>
						独立的解析库,內建缓存,两种解析模式自动切换,为上面的项目提供支持
						<br />
						<a
							href="https://github.com/suconghou/youtubevideoparser"
						>https://github.com/suconghou/youtubevideoparser</a>
					</p>

					<h4>Python版的资源API</h4>
					<p>
						本来计划第一个GO版本部署到GAE,但是发现GAE不让新增部署了,于是为原先的GAE Python项目编写了此代码,更新覆盖代码,工作于GAE+cf,內建缓存
						<br />
						<a href="https://github.com/suconghou/u2proxyapi">https://github.com/suconghou/u2proxyapi</a>
					</p>

					<h4>Python版的视频解析</h4>
					<p>
						由go版本的youtubevideoparser重构而来,只提供解析,不提供流量代理,內建缓存,需要配合其他流量代理服务使用,本来是配合cf worker使用的
						<br />
						<a href="https://github.com/suconghou/u2parse">https://github.com/suconghou/u2parse</a>
					</p>

					<h4>cf worker版的视频解析</h4>
					<p>
						使用Python版的视频解析配合cf worker流量代理,一般情况下工作良好,但是部分视频有机率因IP不一致问题,无法中转.
						<br />遂开发此版本,此版本有两种模式,旧版为即为上述的只中转和缓存流量,不视频解析;新版为完全自主解析和中转.
						<br />由python版本的视频解析重构而来,根据cf的优势內建多级缓存,CDN友好.
						<br />
						<a href="https://github.com/suconghou/u2worker">https://github.com/suconghou/u2worker</a>
					</p>

					<h4>js版的视频解析库</h4>
					<p>
						由go版本的youtubevideoparser重构而来,typescript编写,为cf worker适配,实现接口也可工作于node和浏览器下.为上面的项目提供支持
						<br />
						<a href="https://github.com/suconghou/ujparse">https://github.com/suconghou/ujparse</a>
					</p>

					<h4>最后</h4>
					<p>
						gae要求越来越严了,没有信用卡都不让更新代码了,遂整理了一下之前Go的版本,做一下Wrapper,配合前端页面自动部署,部署于vercel的版本
						<br />就是现在当前工作代码
						<br />
						<a href="https://github.com/suconghou/ustream">https://github.com/suconghou/ustream</a>
					</p>
					<p>
						永远在线的p2p server端
						<br>
						<a href="https://github.com/suconghou/videortc">https://github.com/suconghou/videortc</a>
					</p>

					<p>
						使用flutter编写的简单客户端
						<br>
						<a href="https://github.com/suconghou/u2flutter">https://github.com/suconghou/u2flutter</a>
					</p>

					<h2>信令服务器:</h2>
					<p>
						使用NodeJS 编写的简单websocket server,用于节点发现和信令交换
						<br />
						<a href="https://github.com/suconghou/signalserver">https://github.com/suconghou/signalserver</a>
					</p>
				</div>
			</mu-card>
		</mu-container>
	</div>
</template>

<script>
export default {};
</script>

<style lang="less">
.about-inner {
	padding: 40px;
	.about-c {
        padding: 20px;
        word-break: break-all;
	}
	.save-tips {
		margin-top: 20px;
	}
}
@media screen and (max-width: 1024px) {
	.about-inner {
		padding: 40px 0;
	}
}
</style>