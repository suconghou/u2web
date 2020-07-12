<template>
	<mu-container class="channels" v-if="this.res.snippet">
		<mu-row>
			<mu-col span="12">
				<div class="title">{{title}}</div>
				<div class="pubdate">创建于{{pubdate}}</div>

				<mu-badge class="subcount" :content="subscriberCount" color="secondary"></mu-badge>
				<mu-badge class="viewcount" :content="viewcount" color="primary"></mu-badge>
				<mu-badge class="videocount" :content="videocount" color="success"></mu-badge>

				<div class="desc">{{desc}}</div>
			</mu-col>
		</mu-row>
		<mu-row class="tabs">
			<mu-col span="12">
				<mu-tabs :value="value" inverse color="secondary" text-color="rgba(0, 0, 0, .54)" center>
					<mu-tab value="channel.uploads" :to="{name:'channel.uploads'}">上传的</mu-tab>
					<mu-tab value="channel.fav" :to="{name:'channel.fav'}">收藏的</mu-tab>
					<mu-tab value="channel.list" :to="{name:'channel.list'}">播放列表</mu-tab>
				</mu-tabs>
			</mu-col>
		</mu-row>

		<router-view :res="res" :channel-id="channelId" />
	</mu-container>
</template>

<script>
import { channels, playlistItems, search } from "@/service";
import { timeBefore, formatCount } from "@/utils";

export default {
	data() {
		return {
			res: {},
			value: this.$route.name
		};
	},
	created() {
		this.initroute();
	},
	computed: {
		channelId() {
			return this.$route.params.id;
		},
		title() {
			return this.res.snippet.title;
		},
		desc() {
			return this.res.snippet.description;
		},
		pubdate() {
			return timeBefore(this.res.snippet.publishedAt);
		},
		viewcount() {
			return formatCount(this.res.statistics.viewCount);
		},
		videocount() {
			return this.res.statistics.videoCount + "个视频";
		},
		subscriberCount() {
			const v = this.res.statistics.subscriberCount;
			if (v < 1e4) {
				return `${v}订阅者`;
			}
			return `${(v / 1e4).toFixed(1)}万订阅者`;
		}
	},
	beforeRouteLeave(to,from,next) {
		document.title = "USTREAM - P2P分享";
		next();
	},
	methods: {
		scroll() {
			this.$nextTick(() => {
				const n = document.querySelector(".channels .tabs");
				if (n) {
					n.scrollIntoView({ behavior: "smooth" });
				}
			});
		},
		async init(id) {
			const { ok, data } = await channels(id);
			if (!ok) {
				return;
			}
			this.res = data.items[0] || {};
			setTimeout(()=>{
				document.title = this.title;
			},0)
		},
		initroute() {
			this.scroll();
			const def = "channel.uploads";
			this.init(this.channelId);
			if (
				![
					def,
					"channel.fav",
					"channel.list",
					"channel.list.items"
				].includes(this.$route.name)
			) {
				this.$router.replace({ name: def });
				this.value = def;
			} else {
				this.value = this.$route.name;
			}
		}
	},
	watch: {
		"$route.path"() {
			this.initroute();
		}
	}
};
</script>

<style lang="less">
.channels {
	margin-top: 80px;
	.title {
		font-size: 26px;
	}
	.pubdate {
		color: #888;
	}
	.desc {
		margin: 10px 0;
		font-size: 14px;
		white-space: pre-line;
	}
	.subcount,
	.viewcount {
		margin-right: 10px;
	}
	.pages {
		float: right;
		overflow: hidden;
		margin: 60px 0;
	}
	.filter {
		float: right;
	}
	.tips {
		color: #aaa;
	}
	.tabs {
		margin: 40px 0;
	}
}
</style>