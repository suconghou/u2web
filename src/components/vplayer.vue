<template>
	<div
		class="vplayer"
		:class="{ full: full, audio: audio, fullscreen: !small }"
		tabindex="1"
		@keydown.space.stop.prevent="togglePlay"
		@keydown.left.stop.prevent="seek(-5)"
		@keydown.right.stop.prevent="seek(5)"
		@keydown.s.prevent="doScreenShot"
		@keydown.f.prevent="toggleFull"
	>
		<div
			class="controls"
			:class="{ cleanmode: bottomHide }"
			@mouseenter="maskMouseEnter"
			@mouseleave="maskMouseLeave"
			@mousemove="maskMouseMove"
			@click.stop.prevent="togglePlayOnClick"
			@dblclick.stop.prevent="toggleFull"
		>
			<div class="seeking" v-if="video.seeking"></div>
			<div class="errored" v-if="video.error">
				<div class="errmsg">
					<div
						class="hidebtn"
						v-if="!unsupport"
						@click.stop="video.error = null"
					>
						+
					</div>
					<p v-if="unsupport">此浏览器不支持,请更换浏览器</p>
					<template v-else>
						<p>{{ video.error.stack || video.error }}</p>
						<p v-if="typeof video.error != 'string'">
							播放出错,请刷新重试
						</p>
					</template>
				</div>
			</div>
			<div
				class="clickplay"
				v-if="clickplay && paused"
				@click.stop.prevent="playVideo"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
					<path
						d="M17.28,9l-12.75-8A1,1,0,0,0,3,1.91V17.85a1,1,0,0,0,1.53.85l12.75-8A1,1,0,0,0,17.28,9Z"
					/>
				</svg>
			</div>

			<div class="poster" v-if="audio" :style="poster"></div>
			<div
				class="bottom"
				:class="{ hide: bottomHide }"
				@click.stop.prevent
			>
				<div v-if="audio" class="a-title">{{ playerInfo.title }}</div>
				<div class="progress-bar">
					<div
						ref="progressLine"
						class="progress-line"
						@click.stop="seekTo"
						@mousemove="showCurrTime"
						@mouseenter="tiptime.show = true"
						@mouseleave="tiptime.show = false"
					>
						<div
							ref="times"
							class="times"
							:style="tipStyle"
							v-show="tiptime.show"
							v-text="tiptime.v"
						></div>
						<canvas ref="loadbar" class="loaded"></canvas>
						<div class="played" :style="playedStyle"></div>
						<div class="dot" :style="dotStyle"></div>
					</div>
				</div>
				<div class="btns">
					<div v-if="video.duration" class="play-pause">
						<svg
							v-if="paused"
							@click.stop.prevent="playVideo"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<path
								d="M17.28,9l-12.75-8A1,1,0,0,0,3,1.91V17.85a1,1,0,0,0,1.53.85l12.75-8A1,1,0,0,0,17.28,9Z"
							/>
						</svg>
						<svg
							v-else
							@click.stop.prevent="pauseVideo"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<rect
								x="3"
								y="1"
								width="3"
								height="18"
								rx="1"
								ry="1"
							/>
							<rect
								x="14"
								y="1"
								width="3"
								height="18"
								rx="1"
								ry="1"
							/>
						</svg>
					</div>
					<div v-else class="starting"></div>
					<div class="time-duration">
						<span class="curr">{{
							video.currentTime | timeformat
						}}</span>
						<span class="padding">/</span>
						<span class="total">{{
							video.duration | timeformat
						}}</span>
					</div>

					<div class="full-screen" v-if="!audio">
						<svg
							v-if="small"
							@click="toFull"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<path
								d="M3,9A1,1,0,0,1,2,8V4A2,2,0,0,1,4,2H8A1,1,0,0,1,8,4H4V8A1,1,0,0,1,3,9Z"
							/>
							<path
								d="M17,9a1,1,0,0,1-1-1V4H12a1,1,0,0,1,0-2h4a2,2,0,0,1,2,2V8A1,1,0,0,1,17,9Z"
							/>
							<path
								d="M8,18H4a2,2,0,0,1-2-2V12a1,1,0,0,1,2,0v4H8a1,1,0,0,1,0,2Z"
							/>
							<path
								d="M16,18H12a1,1,0,0,1,0-2h4V12a1,1,0,0,1,2,0v4A2,2,0,0,1,16,18Z"
							/>
						</svg>
						<svg
							v-else
							@click="exitFull"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<path
								d="M7.75,1A1.13,1.13,0,0,1,8.88,2.12v4.5A2.26,2.26,0,0,1,6.62,8.88H2.12a1.13,1.13,0,0,1,0-2.26h4.5V2.12A1.13,1.13,0,0,1,7.75,1Z"
							/>
							<path
								d="M12.25,1a1.13,1.13,0,0,1,1.13,1.12v4.5h4.5a1.13,1.13,0,0,1,0,2.26h-4.5a2.26,2.26,0,0,1-2.26-2.26V2.12A1.13,1.13,0,0,1,12.25,1Z"
							/>
							<path
								d="M2.12,11.12h4.5a2.26,2.26,0,0,1,2.26,2.26v4.5a1.13,1.13,0,0,1-2.26,0v-4.5H2.12a1.13,1.13,0,0,1,0-2.26Z"
							/>
							<path
								d="M13.38,11.12h4.5a1.13,1.13,0,0,1,0,2.26h-4.5v4.5a1.13,1.13,0,0,1-2.26,0v-4.5A2.26,2.26,0,0,1,13.38,11.12Z"
							/>
						</svg>
					</div>
					<div class="fake-full" v-if="!audio">
						<svg
							@click="full = !full"
							viewBox="0 0 1024 1024"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M957.44 962.56H61.44c-25.6 0-40.96-20.48-40.96-40.96V128c0-25.6 20.48-40.96 40.96-40.96h896c25.6 0 40.96 20.48 40.96 40.96v788.48c0 25.6-15.36 46.08-40.96 46.08zM107.52 875.52h808.96V174.08H107.52v701.44z"
								p-id="3558"
							/>
							<path
								d="M424.96 783.36H230.4c-20.48 0-35.84-15.36-35.84-35.84v-189.44h76.8v153.6h153.6v71.68zM271.36 491.52H194.56V296.96c0-20.48 15.36-35.84 35.84-35.84h189.44v76.8h-153.6l5.12 153.6zM824.32 486.4h-76.8v-153.6h-148.48V261.12h184.32c20.48 0 35.84 15.36 35.84 35.84l5.12 189.44zM788.48 783.36h-184.32v-76.8h148.48v-153.6h76.8v189.44c-5.12 25.6-20.48 40.96-40.96 40.96z"
							/>
						</svg>
					</div>
					<div
						class="screenshot"
						v-if="!audio && screenshot && !safari"
					>
						<svg
							@click="doScreenShot"
							viewBox="0 0 1024 1024"
							version="1.1"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M829.187059 851.213725 194.811918 851.213725c-31.577183 0-57.269331-25.691125-57.269331-57.269331L137.542586 311.115783c0-16.880459 7.28901-31.888268 20.524452-42.260499 12.713556-9.959839 29.820166-15.008832 50.841945-15.008832l37.492916 0 3.964288-25.77606c0.714268-15.365966 9.69071-30.184463 24.87555-40.923038 12.722766-8.991792 28.765137-14.362102 42.920532-14.362102l222.033909 0c14.037714 0 30.450523 5.17179 43.895743 13.83203 17.006326 10.952446 26.675546 25.607214 27.424606 41.449018l3.964288 25.780153 227.805356 0c14.240329 0 25.174356 12.174274 30.430056 19.434631 8.215102 11.355629 12.743232 24.791639 12.743232 37.833677l0 482.82861C886.456391 825.521576 860.765265 851.213725 829.187059 851.213725L829.187059 851.213725zM210.786751 308.219827c-16.523325 0-12.760628 9.500375-12.760628 21.760606l0 449.880197c0 6.92676 5.635347 12.56313 12.56313 12.56313l603.163279 0c6.92676 0 12.56313-5.636371 12.56313-12.56313L826.315662 320.788074c0-4.956895 1.118474-12.568247-11.672854-12.568247-42.711777 0-240.016469 0-240.016469 0s-7.028067-46.033429-9.677407-61.318554c-0.696872-4.021593-4.00829-9.06854-6.560416-11.620665-5.219885-5.219885-13.860682-4.066619-16.630772-4.066619l-212.833363-0.061398c-4.89345 0-13.503549-0.720408-18.35095 4.128017-5.628184 5.628184-5.565762 11.620665-5.565762 11.620665l-9.432837 61.322647L210.786751 308.219827zM428.227038 710.539822c-94.692662 0-171.73227-77.04063-171.73227-171.73227 0-94.695732 77.039607-171.735339 171.73227-171.735339 94.695732 0 171.735339 77.039607 171.735339 171.735339C599.962378 633.499192 522.92277 710.539822 428.227038 710.539822L428.227038 710.539822zM428.227038 413.402401c-69.146846 0-125.406175 56.255235-125.406175 125.405151 0 69.146846 56.260351 125.406175 125.406175 125.406175 69.148893 0 125.405151-56.256258 125.405151-125.406175S497.375931 413.402401 428.227038 413.402401L428.227038 413.402401zM755.026012 435.941743l-117.455085 0c-13.514805 0-24.468275-10.956539-24.468275-24.467251 0-13.515828 10.952446-24.472368 24.468275-24.472368l117.455085 0c13.514805 0 24.466228 10.956539 24.466228 24.472368C779.493264 424.985204 768.540817 435.941743 755.026012 435.941743L755.026012 435.941743zM746.56327 432.41543"
							></path>
						</svg>
					</div>

					<div class="audio-list" v-if="audio">
						<svg
							@click="$emit('list')"
							xmlns="http://www.w3.org/2000/svg"
							version="1.1"
							viewBox="0 0 22 32"
						>
							<path
								d="M20.8 14.4q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2zM1.6 11.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2zM20.8 20.8q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2z"
							/>
						</svg>
					</div>
					<div class="volume-wrap">
						<div class="volbtn">
							<svg
								v-if="muted"
								@click="muteoff"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path
									d="M15.9,4.19,14.79,5.85A5,5,0,0,1,16,13a5.21,5.21,0,0,0,1.45,1.4A7,7,0,0,0,15.9,4.19Z"
								/>
								<path
									d="M8.53,5.2,11,3.14V7.67l2,2V3.14A2,2,0,0,0,9.72,1.6L7.1,3.78Z"
								/>
								<path
									d="M11,13.33v3.53h0L6.43,13H3V7H4.67l-2-2H2A1,1,0,0,0,1,6v8a1,1,0,0,0,1,1H5.7l4,3.38a2,2,0,0,0,2.29.2,2.1,2.1,0,0,0,1-1.85v-1.4Z"
								/>
								<rect
									x="8.97"
									y="-2.23"
									width="2"
									height="23.41"
									rx="1"
									ry="1"
									transform="translate(-3.78 9.83) rotate(-45)"
								/>
							</svg>
							<svg
								v-else
								@click="muteon"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path
									d="M11,18.85a2,2,0,0,1-1.28-.47L5.7,15H2a1,1,0,0,1-1-1V6A1,1,0,0,1,2,5H5.64l4-3.34a2.09,2.09,0,0,1,1.94-.44A2,2,0,0,1,13,3.14V16.76a2.09,2.09,0,0,1-1,1.83A2,2,0,0,1,11,18.85ZM3,13H6.43L11,16.86V3.14L6.36,7H3Z"
								/>
								<path
									d="M15.87,15.83l-1.1-1.66a5,5,0,0,0,0-8.32L15.9,4.19a7,7,0,0,1,0,11.64Z"
								/>
							</svg>
						</div>
						<div class="vol-bar-wrap">
							<div class="vol-bar">
								<div
									class="vol-total"
									@click.stop.prevent="volPosTotal"
								></div>
								<div
									class="vol-num"
									ref="numdiv"
									:style="{
										height: (muted ? 0 : vol.v) + 'px',
									}"
									@click.stop.prevent="volPosNum"
								></div>
								<div
									class="vol-dot"
									@mousedown.stop.prevent="dotDown"
									:style="{
										bottom:
											(muted ? 0 : vol.v) + 4.5 + 'px',
									}"
								></div>
							</div>
						</div>
					</div>
					<div class="settings" v-if="!audio">
						<svg
							viewBox="0 0 1024 1024"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M512.458441 673.454182c-88.570221 0-160.628374-72.057129-160.628374-160.628374 0-88.570221 72.058153-160.627351 160.628374-160.627351 88.571245 0 160.628374 72.057129 160.628374 160.627351C673.086815 601.397053 601.029686 673.454182 512.458441 673.454182zM512.458441 438.157201c-41.173748 0-74.670653 33.496905-74.670653 74.66963s33.496905 74.670653 74.670653 74.670653c41.172725 0 74.670653-33.496905 74.670653-74.670653S553.631166 438.157201 512.458441 438.157201z"
							/>
							<path
								d="M599.87949 921.606958 431.591669 921.606958l-42.97886-42.97886c0 0-0.013303 0.303922 0.01228 0.874927-0.12689-2.835581-2.016937-28.167526-29.203112-44.225247-10.321066-6.094812-25.207102-9.317203-43.049468-9.317203-25.173332 0-47.258327 6.391571-47.470151 6.456039l-48.50369-17.579377-100.624768-153.809061 20.519336-63.637366c0 0-0.358157 0.115634-0.99977 0.405229 3.25309-1.464351 31.754215-15.708773 30.728862-64.262606-0.450255-21.335934-7.045463-38.929638-19.60143-52.292993-10.07445-10.722202-20.62883-15.164375-20.73423-15.208377 0.446162 0.185218 0.688685 0.265036 0.688685 0.265036l-21.355377-63.289442 116.239398-183.535083 59.487859-13.196557-0.232291-0.388856c6.250354 3.885494 26.466792 13.731746 44.718481 13.731746 0.001023 0 0.00307 0 0.004093 0 7.212262 0 12.825097-1.272993 17.666358-4.52506 26.491351-17.793248 40.22412-65.424058 42.450834-77.238129l42.234917-34.894741 164.81779 0 42.97886 42.97886c0 0 0.007163-0.216941-0.00614-0.633427 0.051165 1.644453 1.705851 40.543392 39.98262 63.682391 11.289114 6.824429 22.437012 10.141988 34.079166 10.141988 18.544355 0 32.18912-8.736988 32.32522-8.826016-0.396019 0.257873-0.595564 0.408299-0.595564 0.408299l61.657268 13.166881 109.300358 183.586249-21.3871 62.056358c0 0 0.207731-0.073678 0.593518-0.237407-0.110517 0.047072-11.269671 4.865821-21.73707 15.923668-12.840446 13.5629-19.081591 30.211069-19.081591 50.894134 0 21.596877 5.727445 38.319747 17.022699 49.701982 5.942339 5.989411 12.264325 9.067516 12.31242 9.083889l22.081924 65.220421L800.10572 813.939797l-54.772464 14.009062c0 0 0.138146 0.072655 0.408299 0.201591-0.194428-0.092098-15.521508-7.281847-34.561144-7.281847-10.602476 0-20.354584 2.279926-28.981055 6.77531-25.555026 13.31833-37.669948 47.424102-40.181141 59.442834l0.061398-0.308015L599.87949 921.606958zM465.970664 835.649238l102.82283 0c1.449002-3.434216 3.065825-7.011694 4.864798-10.676154 16.266475-33.137725 40.061414-58.573023 68.814272-73.557296 21.016663-10.952446 44.132126-16.505929 68.706825-16.505929 13.373589 0 25.677822 1.682315 36.227086 3.970428l63.435775-92.207052c-0.106424-0.106424-0.211824-0.212848-0.319272-0.320295-19.144012-19.292392-41.964764-54.080709-41.964764-110.248963 0-44.672432 16.146749-84.142375 46.696532-114.14162 2.033309-1.997494 4.065596-3.88754 6.084579-5.677303l-69.272713-116.354008c-11.212366 3.01466-24.240077 5.158487-38.623669 5.158487-27.381627 0-53.80851-7.582699-78.54796-22.538319-33.208333-20.075221-57.81987-49.625234-71.169923-85.453231-1.040702-2.791579-1.976004-5.52176-2.817162-8.178263l-96.851838 0c-10.69355 30.209022-31.501458 72.193229-69.223594 97.53029-19.132756 12.851703-41.203424 19.126616-65.594951 19.126616-0.004093 0-0.007163 0-0.011256 0-18.886139 0-36.630269-3.780093-51.361785-8.754385l-73.780377 116.615974c1.50426 1.364067 3.016707 2.849908 4.52813 4.332678 20.935822 20.544919 46.145993 57.011458 47.348378 113.917516 1.195222 56.623625-20.643156 92.76987-39.174208 113.110127-0.960885 1.055029-1.925862 2.089591-2.888793 3.085268l62.328557 95.2739c11.501962-1.76418 25.295106-3.157923 40.145325-3.157923 33.683147 0 62.873979 7.154957 86.762039 21.263279C437.326277 781.459035 456.316793 810.048163 465.970664 835.649238z"
							/>
						</svg>
						<div class="settings-content">
							<ul class="settings-list">
								<li class="settings-item">
									<div class="s-value">播放速度</div>
									<ul class="s-opt" :rel="video.playbackRate">
										<li
											v-for="(item, index) in speeds"
											:class="{
												active:
													item == video.playbackRate,
											}"
											:key="index"
											@click="playSpeed(item)"
										>
											{{ item }}倍
										</li>
									</ul>
								</li>
								<li class="settings-item">
									<div class="s-value">循环播放</div>
									<ul class="s-opt">
										<li
											:class="{
												active: video.cycle == 1,
											}"
											@click="cyclePlay(1)"
										>
											开
										</li>
										<li
											:class="{
												active: video.cycle == 0,
											}"
											@click="cyclePlay(0)"
										>
											关
										</li>
									</ul>
								</li>
							</ul>
						</div>
					</div>
					<div class="quality-list" v-if="!audio">
						<div class="curr-q" v-text="currq.quality"></div>
						<ul class="qitem-list">
							<li
								v-for="item in qlist"
								class="qitem"
								:class="{ active: currq.itag == item.itag }"
								:key="item.itag"
								@click="switchQuality(item, true)"
								v-text="item.quality"
							></li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<video
			ref="video"
			v-if="v"
			class="video"
			:poster="posterImg"
			:autoplay="autoplay"
			webkit-playsinline="true"
			playsinline="true"
			preload="meta"
			x-webkit-airplay="allow"
			x5-video-player-type="h5-page"
		></video>
	</div>
</template>

<script>
/**
 * 

18  360p  mp4 音视频
22  720p  mp4 音视频


133 240p  mp4 视频
134 360p  mp4 视频
135 480p  mp4 视频
136 720p  mp4 视频
137 1080p mp4 视频

160 144p  mp4 视频
597 144p  mp4 视频(小)

298 720p60   mp4 视频(avc1.4d4020)
299 1080p60  mp4 视频(avc1.64002a)



394 144p    mp4 视频(av01.0.00M.08)
395 240p    mp4 视频(av01.0.00M.08)
396 360p    mp4 视频(av01.0.00M.08)
397 480p    mp4 视频(av01.0.00M.08)
398 720p60  mp4 视频(av01.0.00M.08)
399 1080p60 mp4 视频(av01.0.00M.08)
400 1440p60 mp4 视频(av01.0.00M.08)
401 2160p60 mp4 视频(av01.0.00M.08)
402 4320p60 mp4 视频(av01.0.17M.08)
571 4320p60 mp4 视频(av01.0.17M.08)

140 tiny  mp4 音频
599 tiny  mp4 音频(小)





242 240p  webm 视频
243 360p  webm 视频
244 480p  webm 视频
247 720p  webm 视频
248 1080p webm 视频
271 1440p webm 视频
313 2160p webm 视频

302 720p60  webm 视频
303 1080p60 webm 视频
308 1440p60 webm 视频
315 2160p60 webm 视频

278 144p  webm 视频
598 144p  webm 视频(小)

249 tiny  webm 音频(小)
250 tiny  webm 音频(中)
251 tiny  webm 音频(大)
600 tiny  webm 音频(特小)


 */

const types = {
	mp4: {
		video: {
			"144p": [160, 597],
			"240p": [133, 395],
			"360p": [134, 396],
			"480p": [135, 397],
			"720p": [136],
			"720p60": [398],
			"1080p": [137],
			"1080p60": [399],
			"1440p60": [400],
			"2160p60": [401],
			"4320p60": [402, 571],
		},
		audio: [140, 599],
	},
	webm: {
		video: {
			"144p": [278, 598, 160, 597],
			"240p": [242, 133, 395],
			"360p": [243, 134, 396],
			"480p": [244, 135, 397],
			"720p": [247, 136, 398],
			"720p60": [302, 398],
			"1080p": [248, 137],
			"1080p60": [303, 399],
			"1440p": [271],
			"1440p60": [308, 400],
			"2160p": [313],
			"2160p60": [315, 401],
			"4320p60": [402, 571],
		},
		audio: [249, 250, 251, 600, 140, 599],
	},
};

const key_groups = {
	1: [["240p", "144p", "360p", "480p"]],
	2: [
		["360p", "480p", "240p", "144p"],
		["720p", "1080p", "720p60", "1080p60"],
	],
	3: [
		["240p", "144p"],
		["360p"],
		["480p"],
		["720p", "720p60"],
		["1080p", "1080p60"],
	],
};

// P2P优化模式只保留360P,720P
const prefer_keys = sessionStorage.normal ? key_groups[3] : key_groups[2];

const def = {
	req: "",
	thread: 2,
	thunk: 1048576,
	start: 0,
	end: 1048576,
};

import {
	timeDuration,
	addEventListenerOnce,
	webm,
	debounce,
	asyncQueue,
} from "@/utils";
import delayer from "@/utils/delayer";
import { download } from "@/utils/arraybuffer";
import { imgSrc, videoBaseURL } from "@/service";

const canplay = (t) => {
	if (t && t.len) {
		return (
			Object.keys(t.initRange).length + Object.keys(t.indexRange).length
		);
	}
	return false;
};

const format = (item, playerInfo) => {
	const uri = `/${playerInfo.id}/${item.itag}.${
		/webm/.test(item.type) ? "webm" : "mp4"
	}`;
	const mirrors = videoBaseURL
		.split(";")
		.filter((v) => v)
		.map((v) => v + uri);
	return {
		itag: item.itag,
		quality: item.quality,
		req: mirrors[0],
		init: {
			start: Number(item.initRange.start),
			end: Number(item.initRange.end),
		},
		index: {
			start: Number(item.indexRange.start),
			end: Number(item.indexRange.end),
		},
		mimeCodec: item.type,
		len: Number(item.len),
		duration: Number(playerInfo.duration),
		meta: `${playerInfo.id}:${item.itag}`,
		mirrors,
	};
};

const getvideo = (s, qlist) => {
	for (let q of [...qlist].reverse()) {
		const itag = q.itag;
		return s[itag];
	}
};

const getaudio = (s, itags) => {
	for (let i of itags) {
		if (canplay(s[i])) {
			return s[i];
		}
	}
};

const tickEnd = debounce((self) => {
	const v = self.$refs.video;
	if (!v) {
		return;
	}
	if (v.duration - v.currentTime < 1) {
		self.onPlayEnd();
	}
}, 900);

const modern =
	window.Promise &&
	window.ReadableStream &&
	window.fetch &&
	window.ArrayBuffer;

export default {
	props: {
		playerInfo: {
			type: Object,
			required: true,
		},
		autoplay: {
			type: Boolean,
			default: true,
		},
		audio: {
			type: Boolean,
			default: false,
		},
		firstItag: {
			type: [Number, String],
			default: localStorage.getItem("itag"),
		},
		level: {
			type: Number,
			default: 0,
		},
		nop2p: {
			type: Boolean,
			default: false,
		},
		screenshot: {
			type: Boolean,
			default: true,
		},
	},
	data() {
		return {
			delay: null,
			taskQueue: new asyncQueue([]),
			loader: null,
			muted: false,
			paused: true,
			small: true,
			tiptime: {
				v: "",
				show: false,
				left: "",
			},
			v: false,
			video: {
				duration: 0,
				currentTime: 0,
				played: 0,
				seeking: true,
				error: !modern,
				playbackRate: sessionStorage.getItem("playbackRate") || 1,
				cycle: sessionStorage.getItem("cycle") || 0,
			},
			speeds: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
			vol: {
				v: 60,
			},
			bottomHide: false,
			full: false,
			currq: {
				quality: "",
				itag: 0,
			},
			clickplay: false,
			safari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
		};
	},
	computed: {
		playedStyle() {
			return {
				width: `${this.video.played * 100}%`,
			};
		},
		dotStyle() {
			return {
				left: `calc(${this.video.played * 100}% - 5px)`,
			};
		},
		tipStyle() {
			return {
				left: this.tiptime.left,
			};
		},
		posterImg() {
			return imgSrc(this.playerInfo.id);
		},
		poster() {
			return {
				backgroundImage: `url("${this.posterImg}")`,
			};
		},
		prefer_keys() {
			if (key_groups[this.level]) {
				return key_groups[this.level];
			}
			return prefer_keys;
		},
		mp4() {
			const r = [];
			const s = this.playerInfo.streams;
			if (!this.audio) {
				const f = this.firstItag;
				if (canplay(s[f]) && this.qlist.find((t) => t.itag == f)) {
					r.push(format(s[f], this.playerInfo));
				} else {
					const v = getvideo(s, this.qlist);
					if (v) {
						r.push(format(v, this.playerInfo));
					}
				}
			}
			const a = getaudio(s, types.mp4.audio);
			if (a) {
				r.push(format(a, this.playerInfo));
			}
			return r;
		},
		webm() {
			const r = [];
			const s = this.playerInfo.streams;
			if (!this.audio) {
				const f = this.firstItag;
				if (canplay(s[f]) && this.qlist.find((t) => t.itag == f)) {
					r.push(format(s[f], this.playerInfo));
				} else {
					const v = getvideo(s, this.qlist);
					if (v) {
						r.push(format(v, this.playerInfo));
					}
				}
			}
			const a = getaudio(s, types.webm.audio);
			if (a) {
				r.push(format(a, this.playerInfo));
			}
			return r;
		},
		qlist() {
			const r = [];
			const s = this.playerInfo.streams;
			const videos = webm ? types.webm.video : types.mp4.video;
			for (let groupkeys of this.prefer_keys) {
				for (let q of groupkeys) {
					const itags = videos[q];
					if (!itags) {
						continue;
					}
					let found = false;
					for (let i of itags) {
						if (canplay(s[i])) {
							r.push({
								quality: q,
								itag: i,
							});
							found = true;
							break;
						}
					}
					if (found) {
						break;
					}
				}
			}
			return r.reverse();
		},
		unsupport() {
			if (!modern) {
				return true;
			}
			const v = this.video.error;
			if (!v) {
				return false;
			}
			const s = (v.stack || v).toString();
			if (s.includes("type provided") && s.includes("unsupported")) {
				return true;
			}
			return false;
		},
	},
	created() {
		document.addEventListener("fullscreenchange", this.fullscreenchange);
		document.addEventListener(
			"webkitfullscreenchange",
			this.fullscreenchange
		);
	},
	mounted() {
		this.delay = new delayer(
			() => {
				if (!this.audio) {
					this.bottomHide = true;
				}
			},
			() => {
				this.bottomHide = false;
			},
			2000
		);
		if (!modern) {
			return;
		}
		this.init();
	},
	beforeDestroy() {
		this.taskQueue.clear();
		document.removeEventListener("fullscreenchange", this.fullscreenchange);
		document.removeEventListener(
			"webkitfullscreenchange",
			this.fullscreenchange
		);
		this.destroy();
	},
	methods: {
		fullscreenchange() {
			this.small = !(
				document.fullScreen ||
				document.mozFullScreen ||
				document.webkitIsFullScreen
			);
		},
		destroy() {
			if (this.$refs.video) {
				this.$refs.video.pause();
			}
			if (this.loader) {
				this.loader.destroy();
			}
		},
		init() {
			this.$emit("init");
			this.taskQueue.clear();
			if (this.$refs.video) {
				this.$refs.video.pause();
			}
			if (this.loader) {
				this.loader.destroy();
			}
			this.v = false;
			this.$nextTick(() => {
				this.v = true;
				this.$nextTick(() => {
					const loadItem = webm ? this.webm : this.mp4;
					if (!loadItem.length) {
						this.video.error = "资源不存在或不支持";
						return;
					}
					const v = this.$refs.video;
					v.addEventListener("waiting", () => {
						this.video.seeking = true;
					});
					v.addEventListener("playing", () => {
						this.video.seeking = false;
					});
					v.addEventListener("seeking", () => {
						this.video.seeking = true;
					});
					v.addEventListener("seeked", () => {
						this.video.seeking = false;
					});
					v.addEventListener("pause", () => {
						this.paused = true;
					});
					v.addEventListener("play", () => {
						this.paused = false;
					});
					v.addEventListener("durationchange", () => {
						this.video.duration = v.duration;
					});
					v.addEventListener("progress", () => {
						this.updateLoadBar(v.buffered, v.duration);
					});
					v.addEventListener("timeupdate", () => {
						requestAnimationFrame(() => {
							const played = v.currentTime / v.duration;
							this.video.played = played;
							this.video.currentTime = v.currentTime;
						});
						tickEnd(this);
					});
					v.addEventListener("ended", () => {
						this.onPlayEnd();
					});
					v.addEventListener("loadedmetadata", () => {
						this.video.seeking = false;
						this.playSpeed();
						if (this.autoplay) {
							v.play()
								.then(() => {
									this.clickplay = false;
								})
								.catch((err) => {
									this.clickplay = true;
									console.info(err);
								});
						} else {
							this.clickplay = true;
						}
					});
					v.addEventListener("canplay", () => {
						if (this.autoplay) {
							v.play()
								.then(() => {
									this.clickplay = false;
								})
								.catch((err) => {
									this.clickplay = true;
									console.info(err);
								});
						}
					});
					this.loader = new fastloadjs({
						...def,
						...{ nop2p: this.nop2p },
					});
					this.loader.listen(
						"ready",
						(loaders, dispatchs, initdatas) => {
							this.$emit(
								"loadersready",
								loaders,
								dispatchs,
								initdatas
							);
							// 移动端没有progress事件,只能用这个更新
							loaders.forEach((loader) => {
								loader.listen("res.done", () => {
									this.taskQueue.push(() => {
										return new Promise(
											(resolve, reject) => {
												setTimeout(() => {
													this.updateLoadBar(
														v.buffered,
														v.duration
													);
													resolve();
												}, 100);
											}
										);
									});
								});
							});
						}
					);
					this.loader.listen("error", (err) => {
						this.video.error = err;
						this.loader && this.loader.pause();
					});
					this.loader.attach(v, loadItem);
					if (!this.audio) {
						const loadItemVideo = loadItem[0];
						this.switchQuality({
							itag: loadItemVideo.itag,
							quality: loadItemVideo.quality,
						});
					}

					this.reset();
					this.$emit("load", loadItem);
				});
			});
		},
		onPlayEnd() {
			const v = this.$refs.video;
			if (!v) {
				return;
			}
			if (this.video.cycle == 1) {
				v.currentTime = 0;
				this.video.currentTime = 0;
			} else {
				const vol = v.volume;
				v.volume = 0;
				v.removeAttribute("autoplay");
				v.autoplay = false;
				v.currentTime = 0;
				this.video.currentTime = 0;
				setTimeout(() => {
					v.pause();
				}, 100);
				setTimeout(() => {
					v.pause();
					v.volume = vol;
					setTimeout(() => {
						this.paused = true;
					}, 120);
				}, 180);
				if (this.audio) {
					this.$emit("ended", this.playerInfo);
				}
			}
			// 长视频此处需要cachefill
			this.loader.seekTo(1);
		},
		reset() {
			this.video = {
				duration: 0,
				currentTime: 0,
				played: 0,
				seeking: true,
				error: !modern,
				playbackRate: sessionStorage.getItem("playbackRate") || 1,
				cycle: sessionStorage.getItem("cycle") || 0,
			};
			this.vol = {
				v: 60,
			};
		},
		getTime(dst) {
			const v = this.$refs.video;
			if (!v) {
				return;
			}
			let time = dst * v.duration;
			if (time < 0) {
				time = 0;
			} else if (time > v.duration) {
				time = v.duration;
			}
			return time;
		},
		seek(n) {
			const v = this.$refs.video;
			const t = v.duration;
			if (!v || !t || !isFinite(t)) {
				return;
			}
			const s = v.currentTime + n;
			if (s > 0 && s < t) {
				this.video.currentTime = s;
				v.currentTime = s;
				this.loader.seekTo(s);
			}
			this.delay.reset();
			this.delay.delay();
		},
		seekTo(e) {
			let dx;
			const target = e.target;
			if (target.classList.contains("dot")) {
				dx = target.offsetLeft + e.offsetX;
			} else {
				dx = e.offsetX;
			}
			const w = this.$refs.progressLine.clientWidth;
			const dst = dx / w;
			const time = this.getTime(dst);
			if (!isFinite(time)) {
				return;
			}
			this.video.currentTime = time;
			this.$refs.video.currentTime = time;
			this.tiptime.v = timeDuration(time);
			this.tiptime.show = true;
			this.loader.seekTo(time);
		},
		showCurrTime(e) {
			let dx;
			const target = e.target;
			if (target.classList.contains("dot")) {
				dx = target.offsetLeft + e.offsetX;
			} else {
				dx = e.offsetX;
			}
			const w = this.$refs.progressLine.clientWidth;
			const dst = dx / w;
			const time = this.getTime(dst);
			const sw = this.$refs.times.clientWidth;
			let left = dx - sw / 2;
			if (left < 0) {
				left = 0;
			}
			if (left > w - sw) {
				left = w - sw;
			}
			this.tiptime.v = timeDuration(time);
			this.tiptime.left = `${left}px`;
		},
		togglePlayOnClick() {
			const v = this.$refs.video;
			if (!v || v.readyState <= 1) {
				return;
			}
			if (!this.audio) {
				this.togglePlay();
			}
		},
		togglePlay() {
			const v = this.$refs.video;
			if (!v) {
				return;
			}
			if (v.paused) {
				this.playVideo();
			} else {
				this.pauseVideo();
			}
		},
		toggleFull() {
			if (!this.audio) {
				this.full = !this.full;
			}
		},
		pauseVideo() {
			this.$refs.video && this.$refs.video.pause();
		},
		playVideo() {
			this.$refs.video &&
				this.$refs.video
					.play()
					.then(() => {
						this.clickplay = false;
					})
					.catch((err) => {
						this.clickplay = true;
						console.info(err);
					});
		},
		muteoff() {
			if (this.$refs.video) this.$refs.video.muted = false;
			this.muted = false;
		},
		muteon() {
			if (this.$refs.video) this.$refs.video.muted = true;
			this.muted = true;
		},
		async toFull() {
			try {
				const el = this.$el;
				const rfs =
					el.requestFullScreen ||
					el.webkitRequestFullScreen ||
					el.mozRequestFullScreen ||
					el.msRequestFullScreen;
				await rfs.call(el);
				this.small = false;
			} catch (e) {
				this.small = true;
			}
		},
		async exitFull() {
			try {
				const el = document;
				const cfs =
					el.cancelFullScreen ||
					el.webkitCancelFullScreen ||
					el.mozCancelFullScreen ||
					el.exitFullScreen;
				await cfs.call(el);
				this.small = true;
			} catch (e) {
				this.small = false;
			}
		},
		volPosTotal(e) {
			const n = 60 - e.offsetY;
			this.setVol(n);
		},
		volPosNum(e) {
			const n = e.target.clientHeight - e.offsetY;
			this.setVol(n);
		},
		dotDown(e) {
			let y, vol;
			const onVolMoveProgress = (e) => {
				const w = 60;
				const dx = y - e.pageY;
				let ox = vol + dx;
				if (ox < 0) {
					ox = 0;
				}
				if (ox > w) {
					ox = w;
				}
				this.setVol(ox);
			};
			y = e.pageY;
			vol = this.$refs.numdiv.clientHeight;
			document.addEventListener("mousemove", onVolMoveProgress);
			addEventListenerOnce(document, "mouseup", () => {
				document.removeEventListener("mousemove", onVolMoveProgress);
			});
		},
		setVol(n) {
			const v = this.$refs.video;
			if (!v) {
				return;
			}
			this.vol.v = n;
			v.volume = Math.min(1, n / 60);
			this.muted = !n;
			v.muted = this.muted;
		},
		maskMouseEnter() {
			this.delay.reset();
			requestAnimationFrame(() => {
				this.$el.focus();
			});
		},
		maskMouseLeave() {
			this.delay.do();
		},
		maskMouseMove() {
			this.delay.reset();
			this.delay.delay();
		},
		switchQuality(item, reload) {
			this.currq = item;
			this.firstItag = item.itag;
			if (reload) {
				localStorage.setItem("itag", item.itag);
				this.pauseVideo();
				this.init(); // 当前未实现无缝质量切换.
			}
		},
		playSpeed(v) {
			if (!v) {
				v = sessionStorage.getItem("playbackRate") || 1;
			}
			if (!this.$refs.video) {
				return;
			}
			this.$refs.video.playbackRate = v;
			this.video.playbackRate = v;
			sessionStorage.setItem("playbackRate", v);
		},
		cyclePlay(v) {
			sessionStorage.setItem("cycle", v);
			this.video.cycle = v;
		},
		updateLoadBar(buffered, duration) {
			if (!buffered || !duration) {
				return;
			}
			const c = this.$refs.loadbar;
			if (!c) {
				return;
			}
			const ctx = c.getContext("2d");
			ctx.clearRect(0, 0, c.width, c.height);
			ctx.fillStyle = "#ddd";
			var inc = c.width / duration;
			// display TimeRanges
			for (let i = 0; i < buffered.length; i++) {
				var startX = buffered.start(i) * inc;
				var endX = buffered.end(i) * inc;
				var width = endX - startX;
				ctx.fillRect(startX, 0, width, c.height);
			}
		},
		doScreenShot() {
			// safari screenshot blank images  https://github.com/video-dev/hls.js/issues/1806
			if (!this.screenshot || this.safari) {
				return;
			}
			const v = this.$refs.video;
			if (!v || !v.videoWidth || !v.videoHeight) {
				return;
			}
			const canvas = document.createElement("canvas");
			canvas.width = v.videoWidth;
			canvas.height = v.videoHeight;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(v, 0, 0);
			canvas.toBlob((b) => {
				const name = `screenshot-${+new Date()}.png`;
				download(b, name);
			});
		},
	},
	watch: {
		"playerInfo.id"(v) {
			if (v) {
				this.init();
			}
		},
		full(v) {
			if (v) {
				document.body.style.overflow = "hidden";
			} else {
				document.body.style.overflow = "visible";
			}
		},
	},
	filters: {
		timeformat(t) {
			return timeDuration(t);
		},
	},
};
</script>

<style lang="less">
.clearfix() {
	*zoom: 1; // for ie6 ie7
	&:before,
	&:after {
		content: " "; // 1
		display: table; // 2
	}
	&:after {
		clear: both;
	}
}
.vplayer {
	width: 100%;
	height: 0;
	padding-bottom: 56.25%;
	position: relative;
	overflow: hidden;
	user-select: none;
	font-family: -apple-system-font, "Helvetica Neue", sans-serif;
	font-size: 14px;
	background: #282828;
	outline: none;
	line-height: 1;
	&.fullscreen {
		padding: 0;
		height: 100%;
	}
	&.audio {
		min-height: 100px;
		height: initial;
		padding: 0;
		.controls {
			background: #333;
			.bottom {
				background: #333;
				left: 170px;
				height: 30px;
				.progress-line,
				.loaded,
				.played {
					height: 2px;
				}
				.dot {
					width: 6px;
					height: 6px;
					top: -2px;
				}
				&:hover {
					.progress-line,
					.loaded,
					.played {
						height: 2px;
					}
					.dot {
						width: 6px;
						height: 6px;
					}
				}
				.progress-line {
					.times {
						font-size: 12px;
					}
				}
				.play-pause {
					padding: 6px 0 0;
					svg {
						width: 14px;
						height: 14px;
					}
				}
				.time-duration {
					padding: 4px 0 4px 10px;
					font-size: 12px;
				}
				.volume-wrap {
					padding: 0 5px 0 0;
					top: 7px;
					svg {
						width: 14px;
						height: 14px;
					}
					.vol-bar-wrap {
						top: -78px;
						height: 78px;
						left: 6px;
						.vol-bar {
							border-radius: 6px;
						}
					}
				}
				.a-title {
					position: absolute;
					width: 100%;
					top: -24px;
					text-align: center;
					color: #fff;
					text-shadow: 0 0 1px #888;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					padding: 0 12px;
				}
				.audio-list {
					float: right;
					padding: 7px 10px 0 10px;
					margin-right: 5px;
					svg {
						width: 16px;
						height: 16px;
						fill: #e8e8e8;
						cursor: pointer;
						&:hover {
							fill: #fff;
						}
					}
				}
			}
			.errored {
				bottom: 0;
				z-index: 230;
				.errmsg {
					padding: 0 30px;
					font-size: 12px;
					p {
						margin: 0;
					}
				}
			}
			.seeking {
				left: 0;
				width: 170px;
				position: absolute;
				z-index: 12;
			}
			.clickplay {
				display: none;
			}
			.poster {
				width: 170px;
				height: 100px;
				background-size: cover;
			}
			.starting{
				height: 26px;
			}
		}
	}
	&.full {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		height: 100%;
		z-index: 9999;
		padding: 0;
	}
	.video,
	.controls,
	.poster {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		outline: none;
	}

	.controls {
		z-index: 66;
		&.cleanmode {
			cursor: none;
		}
		.errored {
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 8;
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 60px;
			width: 100%;
			.errmsg {
				background: #222;
				color: #d00;
				padding: 30px;
				box-shadow: 0 0 10px #444;
				position: relative;
				max-width: 100%;
				max-height: 100%;
				.hidebtn {
					z-index: 78;
					position: absolute;
					top: 5px;
					right: 0px;
					line-height: 0;
					font-size: 20px;
					transform: rotate(45deg);
					cursor: pointer;
				}
			}
		}
		.seeking {
			height: 100%;
			background: url("https://assets.suconghou.cn/load.gif") no-repeat
				center;
			background-size: 40px;
		}
		.clickplay {
			cursor: pointer;
			width: 42px;
			height: 42px;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			position: absolute;
			background: rgba(1, 1, 1, 0.5);
			border-radius: 50%;
			border: 2px solid #eee;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 0 6px #eee;
			svg {
				fill: #eee;
				width: 18px;
				height: 18px;
			}
			&:hover {
				border-color: #fff;
				box-shadow: 0 0 6px #fff;
				svg {
					fill: #fff;
				}
			}
		}
		.poster {
			background-size: contain;
			background-position: center center;
			background-repeat: no-repeat;
		}
		.bottom {
			box-sizing: content-box;
			position: absolute;
			z-index: 100;
			bottom: 0;
			height: 40px;
			left: 0;
			right: 0;
			background: linear-gradient(
				to top,
				rgba(0, 0, 0, 0.6),
				rgba(0, 0, 0, 0)
			);
			padding-top: 20px;
			transition: all 0.2s ease;
			&.hide {
				visibility: hidden;
				opacity: 0;
			}
			&:hover {
				.progress-line,
				.loaded,
				.played {
					height: 5px;
				}
				.dot {
					width: 11px;
					height: 11px;
				}
			}
		}
		.progress-bar {
			height: 3px;
		}
		.progress-line {
			width: 100%;
			height: 3px;
			position: relative;
			cursor: pointer;
			background: rgba(255, 255, 255, 0.3);
			.times {
				position: absolute;
				height: 20px;
				top: -26px;
				line-height: 20px;
				border-radius: 1px;
				color: #fff;
				padding: 0 5px;
				display: inline-block;
				left: 0;
				background: rgba(1, 1, 1, 0.8);
				font-size: 14px;
				box-shadow: 0 0 4px rgba(1, 1, 1, 0.5);
				transition: visibility 0.01s ease;
				&.hide {
					visibility: hidden;
				}
			}
			.dot {
				width: 9px;
				height: 9px;
				border-radius: 50%;
				position: absolute;
				background: #fefefe;
				top: -3px;
				left: 0;
			}
			.loaded {
				position: absolute;
				height: 3px;
				width: 100%;
			}
			.played {
				position: absolute;
				height: 3px;
				background: #45a9ff;
				width: 0%;
			}
		}
		.btns {
			.clearfix();
			.play-pause {
				margin-left: 18px;
				float: left;
				padding: 8px 0;
				svg {
					width: 18px;
					height: 18px;
					cursor: pointer;
					fill: #ddd;
					&:hover {
						fill: #fff;
					}
				}
			}
		}
		.starting {
			width: 20px;
			float: left;
			margin-left: 15px;
			height: 36px;
			background: url("https://assets.suconghou.cn/load.gif") no-repeat
				center;
			background-size: contain;
		}
		.time-duration {
			pointer-events: none;
			float: left;
			min-width: 20px;
			max-width: 200px;
			overflow: hidden;
			height: 20px;
			padding: 8px 0 8px 14px;
			color: #ddd;
			font-size: 14px;
			line-height: 20px;
			box-sizing: content-box;
			.curr,
			.total {
				display: inline-block;
			}
			.padding {
				padding: 0 5px;
			}
		}
		.volume-wrap {
			float: right;
			margin-right: 5px;
			text-align: right;
			width: 30px;
			height: 20px;
			padding: 0 0 8px;
			top: 8px;
			color: #ddd;
			line-height: 20px;
			position: relative;
			box-sizing: content-box;
			svg {
				width: 20px;
				height: 20px;
				cursor: pointer;
				fill: #ddd;
				&:hover {
					fill: #fff;
				}
			}
			&:hover {
				.vol-bar-wrap {
					display: block;
				}
			}
			.vol-bar-wrap {
				display: none;
				width: 30px;
				height: 92px;
				position: absolute;
				top: -86px;
				left: 4px;
				z-index: 88;
			}
			.vol-bar {
				position: relative;
				background: rgba(1, 1, 1, 0.8);
				border-radius: 1px;
				width: 30px;
				height: 78px;
				box-shadow: 0 0 2px rgba(1, 1, 1, 0.5);
				.vol-total {
					height: 60px;
					width: 3px;
					background: #919191;
					position: absolute;
					left: 14px;
					bottom: 9px;
					cursor: pointer;
				}
				.vol-dot {
					height: 9px;
					width: 9px;
					border-radius: 50%;
					background: #fff;
					position: absolute;
					left: 11px;
					cursor: pointer;
					bottom: 64.5px;
				}
				.vol-num {
					height: 60px;
					width: 3px;
					background: #45a9ff;
					position: absolute;
					left: 14px;
					bottom: 9px;
					cursor: pointer;
				}
			}
		}
		&.hide {
			display: none;
		}
		.playbutton {
			position: absolute;
			top: 50%;
			left: 50%;
			padding: 9px;
			border: 2px solid #e8e8e8;
			border-radius: 50%;
			cursor: pointer;
			transform: translate(-50%, -50%);
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 196;
			background: rgba(1, 1, 1, 0.5);
			svg {
				width: 20px;
				height: 20px;
				cursor: pointer;
				fill: #e8e8e8;
				position: relative;
				left: 1px;
			}
			&.hide {
				visibility: hidden;
			}
			&.loading {
				border: none;
				background: url("https://assets.suconghou.cn/loading.gif")
					no-repeat center;
				svg {
					display: none;
				}
				background-size: contain;
				width: 14px;
				height: 14px;
			}
			&:hover {
				border-color: #fff;
				svg {
					fill: #fff;
				}
			}
		}
		.screenshot,
		.full-screen,
		.fake-full {
			float: right;
			margin-right: 18px;
			text-align: right;
			width: 40px;
			height: 20px;
			padding: 8px 0;
			color: #ddd;
			line-height: 20px;
			box-sizing: content-box;
			svg {
				width: 20px;
				height: 20px;
				cursor: pointer;
				fill: #ddd;
				&:hover {
					fill: #fff;
				}
			}
		}
		.fake-full {
			margin-right: 2px;
		}
		.screenshot {
			margin-right: 0;
			width: 37px;
			padding-top: 5px;
			svg {
				width: 26px;
				height: 26px;
			}
		}
		.quality-list {
			float: right;
			margin-right: 10px;
			text-align: right;
			color: #ddd;
			line-height: 20px;
			position: relative;
			top: 10px;
			&:hover {
				.qitem-list {
					display: block;
				}
			}
			.qitem-list {
				position: absolute;
				bottom: 18px;
				padding: 0 0 18px 0;
				margin: 0;
				display: none;
				white-space: nowrap;
			}
			.curr-q {
				text-transform: uppercase;
				height: 12px;
				padding: 0 0 10px 14px;
				font-size: 14px;
				line-height: 18px;
				box-sizing: content-box;
			}
			.qitem {
				background: #444;
				display: block;
				text-transform: uppercase;
				padding: 2px 10px;
				cursor: pointer;
				&:hover {
					background: #111;
				}
				&.active {
					background: #45a9ff;
					color: #fff;
					&:hover {
						background: #4599ff;
					}
				}
			}
		}
		.settings {
			float: right;
			padding-right: 10px;
			padding-left: 3px;
			text-align: right;
			color: #ddd;
			line-height: 20px;
			box-sizing: content-box;
			top: 7px;
			position: relative;
			svg {
				width: 22px;
				height: 22px;
				cursor: pointer;
				fill: #ddd;
				&:hover {
					fill: #fff;
				}
			}
			&:hover {
				.settings-content {
					display: block;
				}
			}
			&-content {
				position: absolute;
				bottom: 24px;
				color: #fff;
				width: 76px;
				text-align: left;
				text-indent: 10px;
				padding-bottom: 10px;
				left: -4px;
				display: none;
			}
			&-list {
				padding: 0;
				margin: 4px 0;
				background: #444;
			}
			&-item {
				list-style: none;
				position: relative;
				&:hover {
					cursor: pointer;
					background: #111;
					.s-opt {
						display: block;
					}
				}
				.s-opt,
				ul,
				li {
					list-style: none;
					padding: 4px 0;
					display: block;
				}
				li:hover {
					background: #111;
				}
				.s-value {
					padding: 4px 0;
				}
				.s-opt {
					display: none;
					width: 60px;
					background: #444;
					left: 76px;
					cursor: pointer;
					bottom: 0;
					position: absolute;
					padding: 0;
					li.active {
						color: #2196f3;
					}
				}
			}
		}
	}
}
@media screen and (max-width: 900px) {
	.vplayer {
		.controls {
			.quality-list {
				margin-right: 0;
			}
			.volume-wrap,
			.settings {
				display: none;
			}
		}
	}
}
</style>