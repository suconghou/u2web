<template>
	<div>
		<mu-row>
			<mu-col span="12">
				<mu-text-field
					class="filter"
					v-model="filter"
					action-icon="search"
					:action-click="doSearch"
					@keydown.enter="doSearch"
				></mu-text-field>
			</mu-col>
			<mu-col span="12">
				<div class="tips">共{{listdata.pageInfo.totalResults}}个相关内容</div>
			</mu-col>

			<mu-col span="12">
				<video-list :items="items"></video-list>
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
import videoList from "@/components/videoList";
import { channels, playlistItems, search } from "@/service";

export default {
	components: {
		videoList
	},
	props: {
		res: {
			type: Object,
			required: true
		},
		channelId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			listdata: { pageInfo: {}, items: [] },
			filter: "",
			disabled: false
		};
	},
	computed: {
		items() {
			return this.listdata.items;
		},
		playlistId() {
			return this.res.contentDetails.relatedPlaylists.uploads;
		},
		page() {
			return this.$route.query.page;
		},
		q() {
			return this.$route.query.q;
		}
	},
	created() {
		window.scrollTo(0, 0);
	},
	mounted() {
		this.filter = this.q;
		this.getList();
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
			const id = this.playlistId;
			const pageToken = this.page;
			const { ok, data } = await playlistItems(id, pageToken);
			if (!ok) {
				return;
			}
			this.listdata = data;
		},
		async getList() {
			const pageToken = this.page;
			this.scroll();
			if (this.filter) {
				const id = this.channelId;
				const { ok, data } = await search(this.filter, pageToken, id);
				if (!ok) {
					return;
				}
				this.listdata = data;
				return;
			}
			this.getPlayList(pageToken);
		},
		prev() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.prevPageToken,
				q: this.filter
			};
			this.$router.push({ name, query });
		},
		next() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.nextPageToken,
				q: this.filter
			};
			this.$router.push({ name, query });
		},
		doSearch() {
			const name = this.$route.name;
			const query = {
				q: this.filter
			};
			this.$router.push({ name, query });
		}
	},
	watch: {
		page() {
			this.getList();
		},
		channelId() {
			this.getList();
		},
		q() {
			this.getList();
		}
	}
};
</script>

<style>
</style>