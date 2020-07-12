<template>
	<div>
		<mu-row>
			<mu-col span="12">
				<div class="tips">共{{listdata.pageInfo.totalResults||0}}个相关内容</div>
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
			disabled: false
		};
	},
	computed: {
		items() {
			return this.listdata.items;
		},
		playlistId() {
			return this.res.contentDetails.relatedPlaylists.favorites;
		}
	},
	created() {
		if (this.playlistId) {
			this.getPlayList();
		}
	},
	methods: {
		async getPlayList(pageToken) {
			window.scrollTo(0, 0);
			const id = this.playlistId;
			const { ok, data } = await playlistItems(id, pageToken);
			if (!ok) {
				return;
			}
			this.listdata = data;
		},
		prev() {
			this.getPlayList(this.listdata.prevPageToken);
		},
		next() {
			this.getPlayList(this.listdata.nextPageToken);
		}
	}
};
</script>

<style>
</style>