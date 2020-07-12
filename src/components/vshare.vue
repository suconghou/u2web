<template>
	<div class="vshare">
		<div>
			<p>嵌入页面</p>
			<textarea readonly class="code" v-model="text" spellcheck="false"></textarea>
		</div>
		<div>
			<p>安装组件 - 视频模式</p>
			<textarea readonly class="code" v-model="script" spellcheck="false"></textarea>
			<p>安装组件 - 音频模式</p>
			<textarea readonly class="code" v-model="script_audio" spellcheck="false"></textarea>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		id: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			panel: "",
		};
	},
	computed: {
		text() {
			return `<iframe src="//${location.host}/play?v=${this.id}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" loading="lazy"></iframe>`;
		},
		script() {
			return `<u2-player v="${this.id}"></u2-player>`;
		},
		script_audio() {
			return `<u2-player v="${this.id}" audio="true"></u2-player>`;
		}
	},
	mounted() {},
	methods: {
		
	}
};
</script>

<style lang="less">
.vshare {
	margin: 20px 0;
	.code {
		font-family: monaco, -apple-system, Ubuntu, "Helvetica Neue", sans-serif;
		outline: none;
		padding: 10px;
		width: 100%;
		resize: none;
		background: #272822;
		color: #fff;
		border: none;
	}
}
</style>