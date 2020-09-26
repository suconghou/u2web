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
		loading,
	},
	data() {
		return {
			items: [],
			loading: true,
		};
	},
	computed: {
		listitems() {
			return this.items;
		},
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
			const ids = [];
			this.items = [...this.items, ...data.items].filter((item) => {
				if (ids.includes(item.id)) {
					return false;
				}
				ids.push(item.id);
				return true;
			});
		},
	},
};
</script>

<style lang="less">
</style>
