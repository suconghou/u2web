<template>
	<div class="wrap-inner">
		<mu-container>
			<mu-card>
				<mu-form :model="form" class="mu-set-form" label-position="left" label-width="120">
					<mu-form-item prop="input" label="内容API服务">
						<mu-text-field v-model="form.apiPath" placeholder="留空使用默认值"></mu-text-field>
					</mu-form-item>
					<mu-form-item prop="input" label="视频解析服务">
						<mu-text-field v-model="form.videoCdn" placeholder="留空使用默认值,多个使用;隔开"></mu-text-field>
					</mu-form-item>
					<mu-form-item prop="input" label="信令服务器">
						<mu-text-field v-model="form.wsPrefix" placeholder="留空使用默认值"></mu-text-field>
					</mu-form-item>
					<mu-button color="primary" @click="save">保存</mu-button>
					<mu-alert
						class="save-tips"
						color="success"
						@delete="saved = false"
						delete
						v-if="saved"
						transition="mu-scale-transition"
					>保存成功,刷新后生效!</mu-alert>
				</mu-form>
			</mu-card>
		</mu-container>
	</div>
</template>

<script>
export default {
	data() {
		return {
			form: {
				apiPath: localStorage.getItem("apibaseurl") || "",
				videoCdn: localStorage.getItem("baseurl") || "",
				wsPrefix: localStorage.getItem("ws") || "",
			},
			saved: false
		};
	},
	methods: {
		save() {
			if (this.form.apiPath) {
				localStorage.setItem("apibaseurl", this.form.apiPath);
			} else {
				localStorage.removeItem("apibaseurl");
			}
			if (this.form.videoCdn) {
				localStorage.setItem("baseurl", this.form.videoCdn);
			} else {
				localStorage.removeItem("baseurl");
			}
			if (this.form.wsPrefix) {
				localStorage.setItem("ws", this.form.wsPrefix);
			} else {
				localStorage.removeItem("ws");
			}
			this.saved = true;
		}
	}
};
</script>

<style lang="less">
.wrap-inner {
	padding: 40px;
	.mu-set-form {
		padding: 20px;
	}
	.save-tips {
		margin-top: 20px;
	}
}
@media screen and (max-width: 1024px) {
	.wrap-inner {
		padding: 40px 0;
	}
}
</style>