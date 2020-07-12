<template>
	<mu-container>
		<loading v-if="loading"></loading>
		<mu-row v-else>
			<mu-col span="12">
				<video-list :items="listitems"></video-list>
			</mu-col>
		</mu-row>
	</mu-container>
</template>

<script>
import videoList from "@/components/videoList";
import loading from "@/components/loading";
import { mostPopularVideos } from "@/service";
export default {
	components: {
		videoList,
		loading
	},
	data() {
		return {
			items: [],
			loading: true
		};
	},
	computed: {
		listitems() {
			const res = [];
			const have = [];
			this.items.forEach(item => {
				if (!have.includes(item.etag)) {
					res.push(item);
					have.push(item.etag);
				}
			});
			return res;
		}
	},
	// 1,10,15,20,23
	async created() {
		this.loading = true;
		await this.videoList(10, "TW");
		await this.videoList(10);
		this.loading = false;
	},
	methods: {
		async videoList(videoCategoryId, regionCode = "HK") {
			const { ok, data } = await mostPopularVideos(
				regionCode,
				videoCategoryId
			);
			if (!ok) {
				return;
			}
			this.items = [...this.items, ...data.items];
		}
	}
};
</script>

<style lang="less">
</style>
