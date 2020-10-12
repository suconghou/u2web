<template>
	<div :style="style">
		<template v-if="playerInfo.id">
			<vplayer
				@list="playList"
				@ended="playNext"
				:player-info="playerInfo"
				:autoplay="autoplay"
				:audio="audio"
				:level="level"
				:nop2p="nop2p"
			/>
			<menulist
				ref="playlist"
				:playlist="playlist"
				@play="toPlay"
				v-show="showlist"
			/>
		</template>
		<div v-else :style="poster"></div>
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
			default: true,
		},
		playlist: {
			type: [String, Array],
			default: "",
		},
		nop2p: {
			type: Boolean,
			default: false,
		},
	},
	components: {
		vplayer,
		menulist,
	},
	computed: {
		poster() {
			return {
				backgroundImage: `url("${imgSrc(this.v)}")`,
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
			};
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
			const { ok, data } = await playerInfo(v);
			if (!ok) {
				return;
			}
			this.playerInfo = data;
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
</style>