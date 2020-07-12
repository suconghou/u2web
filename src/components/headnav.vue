<template>
	<div>
		<mu-appbar class="nav-bar" color="primary">
			<mu-button icon slot="left" @click="open=!open">
				<mu-icon value="menu"></mu-icon>
			</mu-button>
			<search slot="right" />
			<mu-button class="heada" flat slot="right" to="/">首页</mu-button>
			<mu-button class="heada" flat slot="right" to="/chat">聊天</mu-button>
			<mu-button class="heada" flat slot="right" to="/about">关于</mu-button>
		</mu-appbar>
		<mu-drawer :open.sync="open" :docked="docked">
			<mu-list>
				<mu-list-item button to="/" @click="open=false">
					<mu-list-item-title>首页</mu-list-item-title>
				</mu-list-item>
				<mu-list-item button to="/chat" @click="open=false">
					<mu-list-item-title>聊天</mu-list-item-title>
				</mu-list-item>
				<mu-list-item button to="/about" @click="open=false">
					<mu-list-item-title>关于</mu-list-item-title>
				</mu-list-item>
				<mu-list-item button to="/setting" @click="open=false">
					<mu-list-item-title>设置</mu-list-item-title>
				</mu-list-item>
			</mu-list>
		</mu-drawer>
	</div>
</template>

<script>
import search from "./search";
export default {
	components: {
		search
	},
	data() {
		return {
			docked: false,
			open: false
		};
	}
};
</script>

<style lang="less">
#app .nav-bar {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	z-index: 9401;

	@media (max-width: 900px) {
		.heada {
			display: none;
		}
	}
}
</style>