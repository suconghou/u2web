<template>
	<div class="loading-bg">
		<div class="loading">
			<span></span>
			<span></span>
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>
</template>

<script>
export default {};
</script>

<style lang="less">
.loading-bg {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	bottom: 0;
	display: flex;
	align-items: center;

	.loading {
		width: auto;
		height: 15px;
		margin: 0 auto;
	}
	.loading span {
		display: inline-block;
		width: 15px;
		height: 100%;
		margin-right: 5px;
		background: #2196f3;
		transform-origin: right bottom;
		animation: load 1s ease infinite;
	}
	.loading span:last-child {
		margin-right: 0px;
	}
	.loading span:nth-child(1) {
		animation-delay: 0.13s;
	}
	.loading span:nth-child(2) {
		animation-delay: 0.26s;
	}
	.loading span:nth-child(3) {
		animation-delay: 0.39s;
	}
	.loading span:nth-child(4) {
		animation-delay: 0.52s;
	}
	.loading span:nth-child(5) {
		animation-delay: 0.65s;
	}
}

@keyframes load {
	0% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		transform: rotate(90deg);
	}
}
</style>