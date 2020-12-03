<template>
	<div :style="style">
		<div class="video-error" v-if="error">
			{{ error }}
		</div>
		<template v-else-if="playerInfo.id">
			<vplayer
				@list="playList"
				@ended="playNext"
				:player-info="playerInfo"
				:autoplay="autoplay"
				:audio="audio"
				:level="level"
				:nop2p="nop2p"
				:screenshot="screenshot"
			/>
			<menulist
				ref="playlist"
				:playlist="playlist"
				@play="toPlay"
				v-show="showlist"
			/>
		</template>
		<div v-else :style="poster">
			<img src="https://assets.suconghou.cn/load.gif" class="v-loading" />
		</div>
	</div>
</template>

<script>
import vplayer from "@/components/vplayer";
import menulist from "@/components/menulist";
import { imgSrc, playerInfo } from "@/service";

// for web components
export default {
	props: {
		v: {
			type: String,
			required: true,
		},
		level: {
			type: Number,
			default: 0,
		},
		autoplay: {
			type: Boolean,
			default: true,
		},
		audio: {
			type: Boolean,
			default: false,
		},
		playlist: {
			type: [String, Array],
			default: "",
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
	components: {
		vplayer,
		menulist,
	},
	computed: {
		poster() {
			return {
				background: `url("${imgSrc(this.v)}") no-repeat center`,
				position: "relative",
				"padding-bottom": "inherit",
				"background-size": "contain",
			};
		},
		style() {
			if (this.audio) {
				return {
					width: "100%",
					height: "100%",
				};
			}
			return {
				width: "100%",
				height: "0",
				"padding-bottom": "56.25%",
				position: "relative",
			};
		},
		error() {
			return this.playerInfo.error || this.playerInfo.msg;
		},
	},
	data() {
		return {
			playerInfo: {},
			showlist: false,
		};
	},
	mounted() {
		setTimeout(() => {
			this.init(this.v);
		}, 50);
	},
	methods: {
		async init(v) {
			try {
				this.playerInfo = {};
				const { ok, data } = await playerInfo(v);
				if (!ok) {
					this.error = data.msg || data;
					return;
				}
				this.playerInfo = data;
			} catch (e) {
				this.$toast.error(e.message || e.toString());
			}
		},
		playList() {
			this.showlist = !this.showlist;
		},
		playNext(vinfo) {
			this.$refs.playlist.playNext(vinfo.id);
		},
		toPlay(v) {
			this.init(v);
		},
	},
};
</script>

<style>
.v-loading {
	display: block;
	position: absolute;
	width: 40px;
	top: 50%;
	height: 40px;
	left: 50%;
	margin-left: -20px;
	margin-top: -20px;
}
.video-error {
	position: absolute;
	top: 50%;
	text-align: center;
	z-index: 99;
	left: 50%;
	transform: translate(-50%, -50%);
	color: #f11;
	min-width: 50%;
	max-width: 80%;
}
</style>