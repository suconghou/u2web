<template>
	<div>
		<mu-paper class="play-list-item" :z-depth="1" @click="toList">
			<mu-row v-if="mini" class="mini">
				<mu-col span="6">
					<img :src="defaultImg" class="loadbg" :class="{loaderr}" />
					<img
						:src="src"
						:class="{loaded:!loading}"
						@load="loading=false"
						@error="loaderr=true"
						class="v-poster-img"
					/>
				</mu-col>
				<mu-col class="meta" span="6">
					<div class="tit">{{v.title}}</div>
					<div class="author" @click.stop="toChannel">{{v.channelTitle}}</div>
					<div class="pub">发布于{{pubdate}}</div>
				</mu-col>
			</mu-row>

			<mu-row v-else>
				<mu-col sm="6" md="5" lg="4" xl="3" span="6">
					<img :src="defaultImg" class="loadbg" :class="{loaderr}" />
					<img
						:src="src"
						:class="{loaded:!loading}"
						@load="loading=false"
						@error="loaderr=true"
						class="v-poster-img"
					/>
				</mu-col>
				<mu-col class="meta" sm="6" md="7" lg="8" xl="9" span="6">
					<div class="tit">{{v.title}}</div>
					<div class="pub">发布于{{pubdate}}</div>
					<div class="desc">{{v.description}}</div>
				</mu-col>
			</mu-row>
		</mu-paper>
	</div>
</template>

<script>
import { imgSrc, defaultImg } from "@/service";
import { timeBefore, formatCount } from "@/utils";

export default {
	props: {
		item: {
			type: Object,
			required: true
		},
		video: {
			type: Boolean,
			default: false
		},
		mini: {
			type: Boolean,
			default: false
		}
	},
	components: {},
	data() {
		return {
			loaderr: false,
			loading: true,
			defaultImg
		};
	},
	computed: {
		v() {
			return this.item.snippet || {};
		},
		videoId() {
			if (this.v.resourceId && this.v.resourceId.videoId) {
				return this.v.resourceId.videoId;
			}
			const m = this.v.thumbnails.high.url.match(/\/([\w\-]{5,20})\//);
			if (m) {
				return m[1];
			}
		},
		src() {
			if (this.videoId) {
				return imgSrc(this.videoId);
			}
		},
		pubdate() {
			if (this.video && this.item.contentDetails && this.item.contentDetails.videoPublishedAt) {
				return timeBefore(this.item.contentDetails.videoPublishedAt);
			}
			return timeBefore(this.v.publishedAt);
		}
	},
	methods: {
		toList() {
			if (this.video) {
				this.$router.push({
					name: "video",
					params: { id: this.videoId },
					query: { list: this.v.playlistId }
				});
				return;
			}

			const listId = this.item.id;
			const id = this.v.channelId;
			this.$router.push({
				name: "channel.list.items",
				params: { id, listId }
			});
		},
		toChannel() {
			const id = this.v.channelId;
			this.$router.push({
				name: "channel.uploads",
				params: { id }
			});
		}
	}
};
</script>

<style lang="less">
.play-list-item {
	min-height: 100px;
	margin: 20px 0;
	padding: 10px;
	&:hover {
		cursor: pointer;
		box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.4),
			0 1px 1px 0 rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.22);
	}
	.v-poster-img {
		width: 100%;
		display: block;
		transition: all 1.2s ease;
		opacity: 0;
		position: absolute;
		top: 0;
		left: 0;
		max-height: 100%;
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
	.meta {
		padding: 0 20px 20px 20px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.mini {
		.tit,
		.pub {
			font-size: 12px;
		}
		.meta {
			padding: 0 0 10px 10px;
		}
		.pub {
			margin-top: 4px;
			color: #ccc;
		}
		.author {
			font-size: 12px;
			margin-top: 4px;
			color: #888;
			transition: all 0.3s ease;
			&:hover {
				color: #06a906;
			}
		}
	}
	.tit {
		font-size: 22px;
		max-height: 3em;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@media (max-width: 1200px) {
		.tit {
			font-size: 18px;
		}
	}
	@media (max-width: 900px) {
		.tit {
			font-size: 14px;
		}
		.desc {
			display: none;
		}
	}
	.desc {
		font-size: 14px;
		max-height: 3em;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pub {
		color: #888;
		margin-top: 10px;
	}
}
</style>