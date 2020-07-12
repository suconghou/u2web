<template>
	<div class="video-lists">
		<video-item v-for="item in items" :item="item" :key="item.etag"></video-item>
		<div class="video-item" v-for="i in [1,2,3,4]" :key="i"></div>
	</div>
</template>

<script>
import videoItem from "./videoItem";
export default {
	props: {
		items: {
			type: Array,
			required: true
		}
	},
	components: {
		videoItem
	},
	data() {
		return {};
	}
};
</script>

<style lang="less">
.video-lists {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;

	.video-item {
	}
}
@media (min-width: 1441px) {
	.video-lists {
		.video-item {
			width: 19%;
			margin-top: 3%;
			color: #111;
		}
	}
}
@media (min-width: 992px) and (max-width: 1440px) {
	.video-lists {
		.video-item {
			width: 24%;
			margin-top: 3%;
			color: #f99;
		}
	}
}
@media (min-width: 768px) and(max-width: 991px) {
	.video-lists {
		.video-item {
			width: 30%;
			margin-top: 5%;
			color: #1f1;
		}
	}
}
@media (max-width: 767px) {
	.video-lists {
		.video-item {
			width: 49%;
			margin-top: 5%;
			color: #1f1;
		}
	}
}
</style>