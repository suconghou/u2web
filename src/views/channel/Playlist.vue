<template>
	<div>
		<template v-if="list">
			<mu-row>
				<mu-col span="12">
					<div class="tips">共{{listdata.pageInfo.totalResults||0}}个相关内容</div>
				</mu-col>

				<mu-col span="12">
					<play-list :items="items"></play-list>
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
		</template>
		<router-view :res="res" v-else />
	</div>
</template>

<script>
import playList from "@/components/playList";
import { channels, playlistItems, search, playlistsInChannel } from "@/service";

export default {
	components: {
		playList
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
			disabled: false
		};
	},
	computed: {
		items() {
			return this.listdata.items;
		},
		list() {
			return this.$route.name == "channel.list";
		},
		page(){
			return this.$route.query.page
		}
	},
	created() {
		this.getPlayList();
	},
	methods: {
		async getPlayList() {
			const pageToken = this.page
			window.scrollTo(0, 0);
			const id = this.channelId;
			const { ok, data } = await playlistsInChannel(id, pageToken);
			if (!ok) {
				return;
			}
			this.listdata = data;
		},
		prev() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.prevPageToken,
			};
			this.$router.push({ name, query });
		},
		next() {
			const name = this.$route.name;
			const query = {
				page: this.listdata.nextPageToken,
			};
			this.$router.push({ name, query });
		}
	},
	watch:{
		page(){
			this.getPlayList();
		}
	}
};
</script>

<style>
</style>