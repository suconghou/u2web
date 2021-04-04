<template>
	<div class="stat-card" :class="len">
		<div class="stat-card-inner" @mouseleave="curr = null">
			<div
				class="box"
				:class="[
					...(status[item.no] ? status[item.no].status : []),
					status[item.no] ? status[item.no].progress : '',
				]"
				@mouseenter="curr = item"
				v-for="(item, index) in segments"
				:key="index"
			></div>
		</div>
		<div class="stat-item-view">
			<div v-show="loadstatus.total">
				<span
					>{{ loadstatus.loaded | byteFormat }} /
					{{ loadstatus.total | byteFormat }}</span
				>
				<span class="save-btn" v-show="loadstatus.done" @click="toSave"
					>保存</span
				>
			</div>
			<template v-if="citem">
				<span class="no">文件块序号:{{ citem.no }}</span>
				<span class="size">大小:{{ citem.size }}</span>
				<span class="address">起止:{{ citem.m }}-{{ citem.n }}</span>
			</template>
		</div>
	</div>
</template>

<script>
import { byteFormat } from "@/utils/index";
import { saveBuffer } from "@/utils/arraybuffer";

export default {
	components: {},
	props: {
		segments: {
			type: Object,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		datas: {
			type: Array,
			required: true,
		},
	},
	computed: {
		len() {
			const len = Object.keys(this.segments).length;
			if (len > 3e3) {
				return ["most"];
			}
			if (len > 1e3) {
				return ["more"];
			}
			return [];
		},
		citem() {
			if (!this.curr) {
				return;
			}
			const { m, n, no } = this.curr;
			return {
				...this.curr,
				size: n - m,
			};
		},
		loadstatus() {
			let loaded = 0,
				total = 0;
			Object.keys(this.segments).forEach((k) => {
				const item = this.segments[k];
				const s = this.status[item.no];
				const z = item.n - item.m;
				total += z;
				const ss = s ? s.status : [];
				if (ss.includes("http-done") || ss.includes("rtc-done")) {
					loaded += z;
				}
			});
			return {
				done: total == loaded,
				total,
				loaded,
			};
		},
	},
	data() {
		return {
			curr: null,
			status: {},
		};
	},
	methods: {
		statusupdate(t, res) {
			let s = this.status[res.no];
			if (!s) {
				s = {
					item: res,
					status: [],
					process: "",
				};
				this.$set(this.status, res.no, s);
			}
			if (t === "progress") {
				const p = Math.ceil(((res.i + 1) / res.n) * 10);
				s.progress = `rtc-found p${p} p${res.i + 1}-${res.n}`;
			} else {
				s.status.push(t);
			}
		},
		async toSave() {
			const name = this.title;
			// initdata & indexdata
			const datas = [...this.datas];
			const len = Object.keys(this.status).length;
			for (let i = 0; i < len; i++) {
				const res = this.status[i];
				datas.push(res.item.data);
			}
			await saveBuffer(datas, name);
		},
	},
	filters: {
		byteFormat(n) {
			return byteFormat(n);
		},
	},
};
</script>

<style lang="less">
@keyframes shining1 {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(0.1);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}
@keyframes shining2 {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(0.2);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}
@keyframes shining3 {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(0.3);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}
@keyframes shining4 {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(0.4);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}
@keyframes shining5 {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(90deg);
		background: #e50bff;
	}
}
@keyframes shining6 {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(180deg);
		background: #e50bff;
	}
}
@keyframes shining7 {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(270deg);
		background: #e50bff;
	}
}
@keyframes shining8 {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(360deg);
		background: #e50bff;
	}
}
@keyframes shining9 {
	0% {
		transform: scale(0.1);
	}
	50% {
		transform: scale(2);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}
@keyframes shining10 {
	0% {
		transform: scale(0.1);
	}
	50% {
		transform: scale(2);
	}
	100% {
		transform: scale(1);
		background: #e50bff;
	}
}

.stat-card {
	margin: 20px 0;
	&-inner {
		display: flex;
		flex-wrap: wrap;
	}
	.box {
		width: 12px;
		height: 12px;
		border: 1px solid #fff;
		background: #eee;
		&.http-start {
			background: #e6af13;
			&.http-done {
				background: #070;
				opacity: 1;
				&.rtc-found {
					background: #0d0;
				}
			}
		}
		&.rtc-start {
			opacity: 0.3;
			background: #0dd6e0;
			&.rtc-done {
				background: #e50bff;
				opacity: 1;
				&.http-start {
					background: #fe03bb;
				}
			}
		}
		&.http-start.rtc-start:not(.http-done):not(.rtc-done):not(.http-error){
			background: #e6af13;
		}
		&.http-error {
			background: #a00;
			opacity: 1;
		}
		&.p1 {
			opacity: 0.35;
			animation: shining1 0.5s 1;
		}
		&.p2 {
			opacity: 0.4;
			animation: shining2 0.51s 1;
		}
		&.p3 {
			opacity: 0.45;
			animation: shining3 0.52s 1;
		}
		&.p4 {
			opacity: 0.55;
			animation: shining4 0.53s 1;
		}
		&.p5 {
			opacity: 0.6;
			animation: shining5 0.54s 1;
		}
		&.p6 {
			opacity: 0.7;
			animation: shining6 0.55s 1;
		}
		&.p7 {
			opacity: 0.75;
			animation: shining7 0.56s 1;
		}
		&.p8 {
			opacity: 0.85;
			animation: shining8 0.57s 1;
		}
		&.p9 {
			opacity: 0.9;
			animation: shining9 0.58s 1;
		}
		&.p10 {
			opacity: 1;
			animation: shining10 0.59s 1;
		}
		&:hover {
			border-color: #888;
		}
	}
	&.more {
		.box {
			width: 10px;
			height: 10px;
		}
	}
	&.most {
		.box {
			width: 6px;
			height: 6px;
		}
	}
	.stat-item-view {
		height: 30px;
		margin-top: 10px;
		font-size: 12px;
		.no,
		.size {
			margin-right: 10px;
		}
		.save-btn {
			margin-left: 10px;
			color: #2196f3;
			cursor: pointer;
		}
	}
}
</style>