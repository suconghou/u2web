<template>
	<div id="app">
		<div id="nav">
			<headnav />
		</div>
		<div class="main-container">
			<backtop />
			<router-view />
		</div>
	</div>
</template>


<script>
import backtop from "@/components/backtop.js";
import headnav from "@/components/headnav";
export default {
	components: {
		headnav,
		backtop
	}
};
</script>

<style lang="less">
.main-container {
	margin-top: 60px;
	margin-bottom: 80px;
}
</style>
