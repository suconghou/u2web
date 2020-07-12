<template>
	<mu-text-field class="mu-docs-search" :solo="true" v-model="text" @keydown.enter="search">
		<mu-icon class="mu-search-icon" value="search" slot="prepend" @click="search" />
	</mu-text-field>
</template>

<script>
import { search } from "@/service";
export default {
	data() {
		return {
			text: this.$route.query.q
		};
	},
	mounted() {
		setTimeout(() => {
			this.text = this.$route.query.q;
		}, 500);
	},
	methods: {
		search() {
			this.$router.push({ name: "search", query: { q: this.text } });
		}
	}
};
</script>

<style lang="less" >
@import "~muse-ui/lib/styles/vars.less";

#nav .mu-docs-search {
	width: 200px;
	transition: width 0.3s @easeOutFunction;
	margin-right: 16px;
	&.mu-input__focus {
		width: 250px;
	}
	.mu-input-content {
		color: #fff;
		background: rgba(255, 255, 255, 0.15);
	}
	.mu-text-field-input {
		color: #fff;
		font-weight: 300;
		font-size: 14px;
	}
	.mu-search-icon {
		width: 56px;
		text-align: center;
		cursor: pointer;
	}
}
</style>