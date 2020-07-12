<template>
	<div class="err404">
		<div class="e-t">404 页面未找到</div>
		<div class="e-msg">
			<mu-button flat to="/">返回首页</mu-button>
		</div>
	</div>
</template>

<script>
export default {};
</script>

<style lang="less">
.err404 {
	margin: 180px auto 40px;
	font-size: 16px;
    text-align: center;
    .e-msg{
        margin-top: 20px;
    }
}
</style>