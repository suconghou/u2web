<template>
	<div class="stat-card" :class="len">
		<div class="stat-card-inner" @mouseleave="curr=null">
			<div
				class="box"
				:rel="rel"
				:class="status[item.no]?status[item.no].status:''"
				@mouseenter="curr=item"
				v-for="(item,index) in segments"
				:key="index"
			></div>
		</div>
		<div class="stat-item-view">
			<div v-show="loadstatus.total">
				<span>{{loadstatus.loaded | byteFormat}} / {{loadstatus.total | byteFormat}}</span>
				<span class="save-btn" v-show="loadstatus.done" @click="toSave">保存</span>
			</div>
			<template v-if="citem">
				<span class="no">文件块序号:{{citem.no}}</span>
				<span class="size">大小:{{citem.size}}</span>
				<span class="address">起止:{{citem.m}}-{{citem.n}}</span>
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
			required: true
		},
		title: {
			type: String,
			required: true
		},
		datas: {
			type: Array,
			required: true
		}
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
				size: n - m
			};
		},
		loadstatus() {
			let loaded = 0,
				total = 0;
			Object.keys(this.segments).forEach(k => {
				const item = this.segments[k];
				const s = this.status[item.no];
				const z = item.n - item.m;
				total += z;
				if (this.rel && s && s.status.indexOf("done") > -1) {
					loaded += z;
				}
			});
			return {
				done: total == loaded,
				total,
				loaded
			};
		}
	},
	data() {
		return {
			curr: null,
			status: {},
			rel: 0
		};
	},
	methods: {
		statusupdate(t, res) {
			if (t.indexOf("start") > -1) {
				this.status[res.no] = {
					status: t
				};
			} else {
				this.status[res.no] = {
					status: res.err ? "error" : t,
					item: res
				};
			}
			this.rel++;
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
		}
	},
	filters: {
		byteFormat(n) {
			return byteFormat(n);
		}
	}
};
</script>

<style lang="less">
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
		&.start {
			background: #e6af13;
			&.rtc {
				background: #0dd6e0;
			}
		}
		&.error {
			background: #a00;
		}
		&.done {
			background: #070;
			&.rtc {
				background: #e50bff;
			}
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