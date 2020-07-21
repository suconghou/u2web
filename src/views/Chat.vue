<template>
	<mu-container>
		<mu-row>
			<mu-col span="12">
				<div class="concat-wrap">
					<div class="left">
						<div class="msg-list">
							<div
								class="msg-item"
								:class="{mime:item.uid==id}"
								v-for="(item,index) in msglist"
								:key="index"
							>
								<div class="chat-user">
									<img :src="'https://gravatar.loli.net/avatar/'+item.uid" alt />
									<cite>{{item.uid}}</cite>
								</div>
								<div class="chat-text">{{item.text}}</div>
							</div>
						</div>
						<div class="send-box">
							<textarea maxlength="200" class="text" v-model="text" @keydown.enter.stop.prevent="send"></textarea>
							<mu-button
								class="send-btn"
								small
								color="primary"
								:disabled="disabled"
								@click.stop.prevent="send"
							>发送</mu-button>
						</div>
					</div>
					<div class="right">
						<div class="mid">{{id}}</div>
						<div class="peer-item" :class="item.state" :cstate="item.cstate" :istate="item.istate" :gstate="item.gstate"  v-for="(item,uid) in stat" :key="uid">
							<p class="p-id">{{uid}}</p>
							<p class="p-meta">
								<span class="tx">发送 {{item.tx | byteFormat}}</span>
								<span class="rx">接收 {{item.rx | byteFormat}}</span>
							</p>
						</div>
					</div>
				</div>
			</mu-col>
		</mu-row>
	</mu-container>
</template>

<script>
var timer;
import { byteFormat } from "@/utils/index";
const rtc = fastloadjs.rtc();
export default {
	data() {
		return {
			id: "",
			stat: {},
			text: "",
			msglist: []
		};
	},
	computed: {
		disabled() {
			return !this.text.replace(/^\s+|\s+$/, "");
		}
	},
	mounted() {
		this.init();
	},
	methods: {
		init() {
			clearInterval(timer);
			this.id = rtc.id;
			timer = setInterval(() => {
				this.stat = rtc.getStats();
			}, 1000);
			rtc.listen("chat", ({ uid, data }) => {
				this.msglist.push({
					uid,
					text: data.text
				});
				setTimeout(() => this.scroll(), 20);
			});
			setTimeout(() => {
				this.stat = rtc.getStats();
				this.msglist.push({
					uid: "机器人",
					text: "尝试发布一条消息吧"
				});
			}, 200);
		},
		send() {
			const text = this.text.replace(/^\s+|\s+$/, "");
			if (!text) {
				return;
			}
			const data = {
				event: "chat",
				data: {
					text: this.text
				}
			};
			rtc.broadcast(JSON.stringify(data));
			this.msglist.push({
				uid: this.id,
				text
			});
			this.text = "";
			setTimeout(() => this.scroll(), 20);
		},
		scroll() {
			const a = this.$el.querySelector(".msg-item:last-child");
			if (a) {
				a.scrollIntoView();
			}
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
.concat-wrap {
	margin: 10px 10px 0;
	padding: 20px;
	.msg-list {
		height: 60vh;
		padding: 40px 10px;
		overflow: auto;
	}
	.send-box {
		position: relative;
		border-top: 1px solid #eee;
		.text {
			outline: none;
			resize: none;
			width: 100%;
			height: 80px;
			border: none;
			padding: 10px;
		}
		.send-btn {
			position: absolute;
			right: 0;
			bottom: 0;
		}
	}
	.left {
		float: left;
		width: 70%;
		padding: 10px;
		background: #fff;
	}
	.right {
		float: right;
		width: 30%;
		background: #f1f1f1;
		text-indent: 10px;
	}
	.msg-item {
		position: relative;
		font-size: 0;
		margin-bottom: 10px;
		padding-left: 60px;
		min-height: 68px;
		box-sizing: content-box;
		&.mime {
			text-align: right;
			padding-left: 0;
			padding-right: 60px;
			.chat-user {
				left: auto;
				right: 3px;
			}
			.chat-text {
				margin-left: 0;
				text-align: left;
				background-color: #5fb878;
				color: #fff;
				&:after {
					left: auto;
					right: -10px;
					border-top-color: #5fb878;
				}
			}
			cite {
				left: auto;
				right: 60px;
				text-align: right;
				text-transform: uppercase;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
		* {
			box-sizing: content-box;
		}
	}
	.chat-text {
		position: relative;
		line-height: 22px;
		margin-top: 25px;
		padding: 8px 15px;
		background-color: #e2e2e2;
		border-radius: 3px;
		color: #333;
		word-break: break-all;
		display: inline-block;
		vertical-align: top;
		font-size: 14px;
		&:after {
			content: "";
			position: absolute;
			left: -10px;
			top: 13px;
			width: 0;
			height: 0;
			border-style: solid dashed dashed;
			border-color: #e2e2e2 transparent transparent;
			overflow: hidden;
			border-width: 10px;
		}
	}
	.chat-user {
		position: absolute;
		left: 3px;
		display: inline-block;
		vertical-align: top;
		font-size: 14px;
		img {
			width: 40px;
			height: 40px;
			border-radius: 100%;
		}
		cite {
			position: absolute;
			left: 60px;
			top: -2px;
			width: 500px;
			line-height: 24px;
			font-size: 12px;
			white-space: nowrap;
			color: #999;
			text-align: left;
			font-style: normal;
			text-transform: uppercase;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	.mid {
		font-size: 12px;
		text-transform: uppercase;
		font-family: "Monaco", "Courier New", Courier, monospace;
		color: #2196f3;
		margin: 20px 0;
	}
	.peer-item {
		font-size: 12px;
		text-transform: uppercase;
		cursor: pointer;
		font-family: "Monaco", "Courier New", Courier, monospace;
		padding: 2px 0;
		.p-id,
		.p-meta {
			margin: 0;
		}
		.tx {
			margin-right: 20px;
		}
		&.open {
			background: #8f8;
		}
		&.connecting {
			background: #fff4a9;
		}
		&.closing {
			background: #fbe1e4;
		}
		&.closed {
			background: #f7c6cc;
		}
		&[cstate=failed],&[istate=failed]{
			background: #ff4a64;
		}
		&:hover {
			background: #ddd;
		}
	}
}
@media screen and (max-width: 1024px) {
	.concat-wrap {
		padding: 0;
		margin: 10px 0 0;
		.left {
			width: 100%;
		}
		.right {
			width: 100%;
		}
		.chat-user {
			cite {
				width: 100px;
			}
		}
	}
}
</style>