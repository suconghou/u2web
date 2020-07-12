<template>
	<div class="audio-play-list">
		<div
			class="audio-item"
			:class="{curr:item.v==curr.v}"
			@click="toPlay(item)"
			v-for="(item,index) in lists"
			:key="item.v"
		>{{index+1}} {{item.title}}</div>
	</div>
</template>

<script>
import { playlistItems } from "@/service";
export default {
	props: {
		playlist: {
			type: [String, Array],
			default: ""
		}
	},
	data() {
		return {
			curr: {},
			lists: []
		};
	},
	created() {
		if (Array.isArray(this.playlist)) {
			this.lists = this.playlist;
		} else if (this.playlist) {
			this.initList(this.playlist);
		}
	},
	methods: {
		async initList(listId) {
			let pageToken = undefined;
			while (true) {
				const { ok, data } = await playlistItems(listId, pageToken, 50);
				if (!ok) {
					return;
				}
				this.push(data);
				pageToken = data.nextPageToken;
				if (!pageToken) {
					break;
				}
			}
		},
		push(data) {
			const items = data.items
				.filter(item => {
					return item.contentDetails.videoPublishedAt;
				})
				.map(item => {
					return {
						v: item.contentDetails.videoId,
						title: item.snippet.title
					};
				});
			this.lists = [...this.lists, ...items];
		},
		toPlay(item) {
			this.$emit("play", item.v);
			this.curr = item;
		},
		playNext(v) {
			const index = this.lists.findIndex(item => item.v == v);
			const item = this.lists[index + 1];
			if (item) {
				this.toPlay(item);
			}
		}
	}
};
</script>

<style lang="less">
.audio-play-list {
	background: #344;
	color: #eee;
	font-size: 12px;
	text-indent: 10px;
	max-height: 280px;
	overflow: auto;
	.audio-item {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		padding: 4px 10px 4px 2px;
		cursor: pointer;
		&:hover,
		&.curr {
			background: #222;
			text-shadow: 0 0 1px #eee;
		}
	}
}
</style>