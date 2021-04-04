<template>
	<div class="stat-card-info">
		<div class="color-type">
			<div class="label">
				<span class="box http-start"></span>
				<span>HTTP开始下载</span>
			</div>
			<div class="label">
				<span class="box start rtc-start"></span>
				<span>RTC开始探测</span>
			</div>
			<div class="label">
				<span class="box http-start http-done"></span>
				<span>HTTP已完成</span>
			</div>
			<div class="label">
				<span class="box rtc-start rtc-done"></span>
				<span>RTC已完成</span>
			</div>
			<div class="label">
				<span class="box http-error"></span>
				<span>HTTP错误</span>
			</div>
			<div class="label">
				<span class="box http-start rtc-start http-done"></span>
				<span>HTTP和RTC同时下载,但HTTP先完成</span>
			</div>
			<div class="label">
				<span class="box http-start rtc-start rtc-done"></span>
				<span>HTTP和RTC同时下载,但RTC先完成</span>
			</div>
		</div>
		<div class="rtc-stat">
			<div class="m-info">
				<span class="m-name">{{ mid }}</span>
				<span class="m-s" v-show="mid"
					>{{ statOnNum }}/{{ Object.keys(stat).length }}</span
				>
			</div>

			<div
				class="rtc-peer"
				:class="item.state"
				:cstate="item.cstate"
				:istate="item.istate"
				:gstate="item.gstate"
				v-for="(item, key) in stat"
				:key="key"
			>
				<span class="name">节点 {{ key }}</span>
				<span class="traff">已发送 {{ item.tx | byteFormat }}</span>
				<span class="traff">已接收 {{ item.rx | byteFormat }}</span>
			</div>
		</div>
		<mu-paper :z-depth="1">
			<div class="v-stat">
				<div class="type-title">视频统计</div>
				<statcard
					ref="v"
					:title="names.vtitle"
					:segments="vdispatch"
					:datas="vdatas"
				/>
			</div>
		</mu-paper>
		<mu-paper :z-depth="1">
			<div class="v-stat">
				<div class="type-title">音频统计</div>
				<statcard
					ref="a"
					:title="names.atitle"
					:segments="adispatch"
					:datas="adatas"
				/>
			</div>
		</mu-paper>
	</div>
</template>

<script>
import statcard from "@/components/statcard";
import { byteFormat } from "@/utils/index";

export default {
	props: {
		title: {
			type: String,
			default: true,
		},
		loadItems: {
			type: Array,
			required: true,
		},
	},
	components: {
		statcard,
	},
	data() {
		return {
			vdispatch: {},
			adispatch: {},
			vdatas: [],
			adatas: [],
			stat: {},
			mid: "",
		};
	},
	computed: {
		names() {
			const [v, a] = this.loadItems;
			let vtitle = "",
				atitle = "";
			if (v) {
				const vext = /webm/.test(v.mimeCodec) ? "webm" : "mp4";
				vtitle = `${this.title}-${v.itag}.${vext}`;
			}
			if (a) {
				const aext = /webm/.test(a.mimeCodec) ? "webm" : "mp4";
				atitle = `${this.title}-${a.itag}.${aext}`;
			}
			return {
				vtitle,
				atitle,
			};
		},
		statOnNum() {
			let i = 0;
			Object.keys(this.stat).forEach((k) => {
				if (this.stat[k].state == "open") {
					i++;
				}
			});
			return i;
		},
	},
	methods: {
		onLoadersready(
			[vloader, aloader],
			[vdispatch, adispatch],
			[vdatas, adatas]
		) {
			this.vdispatch = vdispatch || {};
			this.adispatch = adispatch || {};
			this.vdatas = vdatas || [];
			this.adatas = adatas || [];

			// 视频数据
			const t = this.$refs;
			if (vloader) {
				vloader.listen("rtc.stat", (stat, mid) => {
					this.stat = stat;
					this.mid = mid;
				});
				vloader.listen("res.start", (item) => {
					// 某一文件块,要开始下载了
					t.v && t.v.statusupdate("http-start", item);
				});
				vloader.listen("res.done", (res) => {
					// 某一文件块已完成,可能成功,可能失败
					t.v &&
						t.v.statusupdate(
							res.err ? "http-error" : "http-done",
							res
						);
				});
				vloader.listen("res.rtc.start", (item) => {
					// 某一文件块,要开始下载了
					t.v && t.v.statusupdate("rtc-start", item);
				});
				vloader.listen("res.rtc.done", (res) => {
					// rtc某一文件块已完成
					t.v && t.v.statusupdate("rtc-done", res);
				});
				vloader.listen("res.rtc.progress", (res) => {
					// res : {i,n,uid,no}
					t.v && t.v.statusupdate("progress", res);
				});
			}

			if (aloader) {
				aloader.listen("rtc.stat", (stat, mid) => {
					this.stat = stat;
					this.mid = mid;
				});
				aloader.listen("res.start", (item) => {
					// 某一文件块,要开始下载了
					t.a && t.a.statusupdate("http-start", item);
				});
				aloader.listen("res.done", (res) => {
					// 某一文件块已完成,可能成功,可能失败
					t.a &&
						t.a.statusupdate(
							res.err ? "http-error" : "http-done",
							res
						);
				});
				aloader.listen("res.rtc.start", (item) => {
					// 某一文件块,要开始下载了
					t.a && t.a.statusupdate("rtc-start", item);
				});
				aloader.listen("res.rtc.done", (res) => {
					// rtc某一文件块已完成
					t.a && t.a.statusupdate("rtc-done", res);
				});
				aloader.listen("res.rtc.progress", (res) => {
					// res : {i,n,uid,no}
					t.a && t.a.statusupdate("progress", res);
				});
			}
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
.stat-card-info {
	margin: 50px 0;
	.v-stat {
		padding: 30px 10px;
		margin: 20px 0;
	}
	.type-title {
		font-size: 18px;
	}
	.color-type {
		.label {
			font-size: 12px;
			.box {
				width: 12px;
				height: 12px;
				border: 1px solid #fff;
				background: #eee;
				display: inline-block;
				margin-right: 10px;
				&.http-start {
					background: #e6af13;
					&.http-done {
						background: #070;
						opacity: 1;
						&.rtc-start {
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
				&.http-start.rtc-start:not(.http-done):not(.rtc-done):not(.http-error) {
					background: #e6af13;
				}
				&.http-error {
					background: #a00;
					opacity: 1;
				}
			}
		}
	}
}
.rtc-stat {
	.m-info {
		margin-top: 20px;
		height: 30px;
		font-family: "Monaco", "Courier New", Courier, monospace;
	}
	.m-name {
		max-width: 340px;
		text-transform: uppercase;
		margin-right: 20px;
		display: inline-block;
	}
	.m-s {
		display: inline-block;
		width: 120px;
		margin-right: 20px;
	}
	.rtc-peer {
		font-size: 12px;
		margin: 10px 0;
		background: #ddd;
		.name {
			max-width: 300px;
			display: inline-block;
			font-family: "Monaco", "Courier New", Courier, monospace;
			text-transform: uppercase;
			margin-right: 20px;
		}
		.traff {
			display: inline-block;
			width: 120px;
			margin-right: 20px;
		}
		&.open {
			background: #8f8 !important;
		}
		&.connecting {
			background: #fff4a9;
		}
		&.closing {
			background: #e2aab0;
		}
		&.closed {
			background: #e96675;
		}
		&[cstate="failed"],
		&[istate="failed"] {
			background: #ff4a64;
		}
	}
}
@media screen and (max-width: 1024px) {
	.rtc-peer {
		.name {
			margin-right: 0;
		}
	}
}
</style>