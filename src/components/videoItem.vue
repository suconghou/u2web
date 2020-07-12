<template>
	<div class="video-item" @click="toVideo">
		<div class="vitem">
			<div class="v-poster">
				<img :src="defaultImg" class="loadbg" :class="{loaderr}" />
				<img
					:src="src"
					:class="{loaded:!loading}"
					@load="loading=false"
					@error="loaderr=true"
					class="v-poster-img"
				/>
				<div class="v-dur" v-if="duration">{{duration}}</div>
			</div>
			<div class="v-title">
				<div>{{title}}</div>
			</div>
			<div class="v-meta">
				<div class="channel-title" @click.stop="toChannel">{{channel}}</div>
				<div class="viewcount">{{viewcount}}</div>
				<div class="pubdate">{{date}}</div>
			</div>
		</div>
	</div>
</template>

<script>
import { imgSrc, defaultImg } from "@/service";
import { timeBefore, formatCount, formatDuration } from "@/utils";
export default {
	props: {
		item: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			defaultImg,
			loading: true,
			loaderr: false
		};
	},
	computed: {
		v() {
			return this.item.snippet || {};
		},
		id() {
			if (this.v.resourceId) {
				return this.v.resourceId.videoId;
			}
			return (this.item.id && this.item.id.videoId) || this.item.id;
		},
		title() {
			return this.v.title;
		},
		src() {
			return imgSrc(this.id);
		},
		duration() {
			if (
				!this.item.contentDetails ||
				!this.item.contentDetails.duration
			) {
				return;
			}
			return formatDuration(this.item.contentDetails.duration);
		},
		viewcount() {
			if (!this.item.statistics) {
				return "";
			}
			return formatCount(this.item.statistics.viewCount);
		},
		date() {
			return timeBefore(this.v.publishedAt);
		},
		channel() {
			return this.v.channelTitle;
		},
		channelId() {
			return this.v.channelId;
		}
	},
	methods: {
		toVideo() {
			const playlistId = this.v.playlistId;
			const query = {};
			if (playlistId) {
				query.list = playlistId;
			}
			this.$router.push({
				name: "video",
				params: { id: this.id },
				query
			});
		},
		toChannel() {
			this.$router.push({
				name: "channel.uploads",
				params: { id: this.channelId }
			});
		}
	}
};
</script>

<style lang="less">
.vitem {
	position: relative;
	background: #fff;
	overflow: hidden;
	box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
		0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);
	transition: all 0.3s ease;
	&:hover {
		box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.4),
			0 1px 1px 0 rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.22);
		cursor: pointer;
	}
	.v-poster {
		position: relative;
		overflow: hidden;
		&-img {
			width: 100%;
			display: block;
			transition: all 1.2s ease;
			opacity: 0;
			position: absolute;
			top: 0;
			left: 0;
			&.loaded {
				opacity: 1;
			}
		}
		.loadbg {
			width: 100%;
			display: block;
			transition: all 1.2s ease;
			background: url("https://assets.suconghou.cn/load.gif")
				no-repeat center;
			background-size: 30px;
			&.loaderr {
				background-image: none;
			}
		}
		.v-dur {
			position: absolute;
			right: 5px;
			bottom: 5px;
			background: #111;
			box-shadow: 0 0 1px #111;
			text-align: center;
			padding: 1px 8px;
			font-size: 12px;
			color: #fff;
		}
	}

	.v-title {
		height: 55px;
		background: #fff;
		padding: 10px;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.7em;
		font-size: 14px;
		transition: all 0.3s ease;
		color: #555;
		&:hover {
			color: #000;
		}
	}
	.v-meta {
		height: 40px;
		padding: 0 10px 10px;
	}
	.channel-title {
		height: 20px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
		color: #666;
		transition: all 0.3s ease;
		&:hover {
			color: #06a906;
		}
	}
	.pubdate {
		font-size: 12px;
		position: absolute;
		left: 10px;
		color: #ccc;
	}
	.viewcount {
		font-size: 12px;
		position: absolute;
		right: 10px;
		color: #ccc;
	}
}
</style>