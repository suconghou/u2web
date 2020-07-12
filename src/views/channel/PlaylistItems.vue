<template>
	<div>
		<mu-row>
			<mu-col span="12" class="view-tools">
				<div class="tips">共{{listdata.pageInfo.totalResults||0}}个相关内容</div>
				<div class="mode">
					<mu-icon value="view_list" :color="listview?'primary':''" @click="listview=true"></mu-icon>
					<mu-icon value="view_module" :color="listview?'':'primary'" @click="listview=false"></mu-icon>
				</div>
			</mu-col>
			<mu-col span="12">
				<play-list :items="items" :video="true" v-if="listview"></play-list>
				<video-list :items="items" v-else></video-list>
			</mu-col>
		</mu-row>
		<mu-row>
			<mu-col span="12">
				<div class="pages">
					<mu-button
						small
						flat
						color="primary"
						:disabled="disabled"
						v-if="listdata.prevPageToken"
						@click="prev"
					>上一页</mu-button>
					<mu-button
						small
						flat
						color="primary"
						:disabled="disabled"
						v-if="listdata.nextPageToken"
						@click="next"
					>下一页</mu-button>
				</div>
			</mu-col>
		</mu-row>
	</div>
</template>

<script>
import playList from "@/components/playList";
import videoList from "@/components/videoList";
import { channels, playlistItems, search, playlistsInChannel } from "@/service";

export default {
	components: {
		playList,
		videoList
	},
	props: {
		res: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			listdata: { pageInfo: {}, items: [] },
			disabled: false,
			listview: true
		};
	},
	computed: {
		items() {
			return this.listdata.items;
		},
		playlistId() {
			return this.$route.params.listId;
		},
		page() {
			return this.$route.query.page;
		}
	},
	created() {
		this.getPlayList();
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
		async getPlayList() {
			const pageToken = this.page;
			this.scroll();
			const id = this.playlistId;
			const { ok, data } = await playlistItems(id, pageToken);
			if (!ok) {
				return;
			}
			this.listdata = data;
			this.scroll();
		},
		prev() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.prevPageToken
			};
			this.$router.push({ name, query });
		},
		next() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.nextPageToken
			};
			this.$router.push({ name, query });
		}
	},
	watch: {
		page() {
			this.getPlayList();
		}
	}
};
</script>

<style lang="less">
.view-tools {
	display: flex;
	justify-content: space-between;
	.mu-icon {
		cursor: pointer;
	}
}
</style>