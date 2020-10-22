<template>
	<mu-container class="video-player">
		<loading v-if="loading"></loading>
		<mu-row v-else>
			<mu-col lg="8" xl="8" md="7" sm="12" span="12">
				<div class="v-error vplayer-wrapper" v-if="error">
					<div class="err-msg">
					{{ error }}
					</div>
				</div>
				<template v-else>
					<div class="m-title">{{ v.title }}</div>
					<div
						class="vplayer-wrapper"
						:class="{ loading: !playerInfo.id }"
					>
						<vplayer
							ref="player"
							@init="initPlayer"
							@load="loadItem"
							@loadersready="onLoadersready"
							v-if="playerInfo.id"
							:player-info="playerInfo"
							:v="playerInfo.id"
						/>
					</div>
					<div class="channel" @click="toChannel">
						{{ v.channelTitle }}
					</div>
					<div class="m-meta">
						<span class="pubdate" v-show="v.publishedAt"
							>发布于{{ date }}</span
						>
						<mu-badge
							class="duration"
							:content="duration"
							color="secondary"
						></mu-badge>
						<mu-badge
							class="viewcount"
							:content="viewcount"
							color="primary"
						></mu-badge>
						<mu-badge
							class="iframe"
							content="嵌入视频"
							@click="toShare"
							color="error"
						></mu-badge>
					</div>
					<div class="m-desc">{{ v.description }}</div>
					<div></div>
					<div class="tags">
						<span
							class="tag"
							v-for="t in v.tags"
							v-text="t"
							:key="t"
						></span>
					</div>

					<mu-dialog
						title="嵌入视频播放器"
						width="80%"
						:open.sync="shareDialog"
					>
						<vshare v-if="shareDialog" :id="playerInfo.id" />
						<mu-button
							slot="actions"
							flat
							color="primary"
							@click="shareDialog = false"
							>关闭</mu-button
						>
					</mu-dialog>

					<div class="stat-wrapper">
						<statcard-info
							v-if="stat"
							:title="playerInfo.title"
							:load-items="loadItems"
							ref="stat"
						/>
					</div>
				</template>
			</mu-col>

			<mu-col lg="4" xl="4" md="5" sm="12" span="12" class="aside">
				<play-list :items="items" :video="true" :mini="true" />
			</mu-col>
		</mu-row>
	</mu-container>
</template>

<script>
import { videoInfo, playlistItems, relatedVideo, playerInfo } from "@/service";
import { timeBefore, formatCount, formatDuration } from "@/utils";
import playList from "@/components/playList";
import loading from "@/components/loading";
import statcardInfo from "@/components/statcardInfo";
import vplayer from "@/components/vplayer";
import vshare from "@/components/vshare";
export default {
	components: {
		vplayer,
		playList,
		statcardInfo,
		vshare,
		loading,
	},
	data() {
		return {
			shareDialog: false,
			info: {
				snippet: {},
			},
			listdata: {
				items: [],
			},
			playerInfo: {},
			stat: false,
			loadItems: [],
			loading: true,
			error: "",
		};
	},
	created() {
		window.scrollTo(0, 0);
	},
	beforeMount() {},
	computed: {
		id() {
			return this.$route.params.id;
		},
		listId() {
			return this.$route.query.list;
		},
		channelId() {
			return this.v.channelId;
		},
		v() {
			return this.info.snippet || {};
		},
		date() {
			return timeBefore(this.v.publishedAt);
		},
		duration() {
			if (
				!this.info.contentDetails ||
				!this.info.contentDetails.duration
			) {
				return;
			}

			return formatDuration(this.info.contentDetails.duration);
		},
		viewcount() {
			if (!this.info.statistics) {
				return "";
			}
			return formatCount(this.info.statistics.viewCount);
		},
		items() {
			return this.listdata.items.filter((v) => {
				if (!v.snippet.resourceId) {
					return true;
				}
				if (v.contentDetails && !v.contentDetails.videoPublishedAt) {
					return false;
				}
				return v.snippet.resourceId.videoId != this.id;
			});
		},
	},
	beforeRouteLeave(to, from, next) {
		if (this.$refs.player) {
			this.$refs.player.$destroy();
		}
		document.title = "USTREAM - P2P分享";
		next();
	},
	methods: {
		toChannel() {
			const id = this.channelId;
			this.$router.push({ name: "channel.uploads", params: { id } });
		},
		toShare() {
			this.shareDialog = true;
		},
		async getInfo(id) {
			try {
				this.loading = true;
				this.error = "";
				this.getPlayer(id);
				const { ok, data } = await videoInfo(id);
				this.loading = false;
				if (!ok) {
					return;
				}
				this.info = data.items[0] || {};
				if (!this.info.snippet) {
					this.error = "视频不存在或无权限";
					return;
				}
				document.title = this.info.snippet.title;
			} catch (e) {
				this.$toast.error(e.message || e.toString());
			}
		},
		async getPlayer(id) {
			try {
				this.playerInfo = {};
				const { ok, data } = await playerInfo(id);
				if (!ok) {
					return;
				}
				this.playerInfo = data;
			} catch (e) {
				this.$toast.error(e.message || e.toString());
			}
		},
		async getList(id) {
			const { ok, data } = await playlistItems(id);
			if (!ok) {
				return;
			}
			this.listdata = data;
		},
		async getRelated(id) {
			const { ok, data } = await relatedVideo(id);
			if (!ok) {
				return;
			}
			this.listdata = data;
		},
		loadItem(loadItem) {
			this.loadItems = loadItem;
		},
		onLoadersready(loaders, dispatchs, initdatas) {
			this.$refs.stat.onLoadersready(loaders, dispatchs, initdatas);
		},
		initPlayer() {
			this.stat = false;
			this.$nextTick(() => {
				this.stat = true;
			});
		},
	},
	watch: {
		id: {
			immediate: true,
			handler(v) {
				if (v) {
					this.getInfo(v);
					if (!this.listId) {
						this.getRelated(v);
					}
				}
			},
		},
		listId: {
			immediate: true,
			handler(v) {
				if (v) {
					this.getList(v);
				}
			},
		},
		"$route.path"() {
			const n = document.querySelector(".m-title");
			if (n) {
				n.scrollIntoView({ behavior: "smooth", block: "end" });
			} else {
				window.scrollTo(0, 0);
			}
		},
	},
};
</script>

<style lang="less">
.video-player {
	margin-top: 80px;
	.v-error {
		display: flex;
		justify-content: center;
		align-items: center;
		background: #eee;
		font-size: 20px;
		position: relative;
		.err-msg{
			position: absolute;
			left: 50%;
			top:50%;
			transform: translate(-50%,-50%);
		}
	}
	.vplayer-wrapper {
		height: 0;
		padding-bottom: 56.25%;
		&.loading {
			background: url("https://assets.suconghou.cn/load.gif") no-repeat
				center #eee;
			background-size: 40px;
		}
	}
	.m-title {
		margin: 20px 0;
		font-size: 22px;
		word-break: break-all;
	}
	.channel {
		display: inline-block;
		margin-top: 10px;
		font-weight: bold;
		transition: all 0.3s ease;
		&:hover {
			cursor: pointer;
			color: #2196f3;
		}
	}
	.m-desc {
		margin: 20px 0;
		white-space: pre-line;
		word-break: break-all;
	}
	.tags {
		word-break: break-word;
		.tag {
			display: inline-block;
			margin: 6px 4px;
			padding: 1px 8px;
			font-size: 12px;
			color: #fff;
			background: #bbb;
			border-radius: 10px;
			white-space: nowrap;
		}
	}
	.m-meta {
		margin: 10px 0;
		.pubdate,
		.duration,
		.viewcount {
			margin-right: 10px;
		}
		.iframe {
			cursor: pointer;
		}
	}
	@media (max-width: 767px) {
		.aside {
			padding-left: 0 !important;
		}
	}
	.aside {
		padding-left: 20px;
		padding-top: 50px;
	}
}
</style>