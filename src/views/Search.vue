<template>
	<mu-container class="search-lists">
		<loading v-if="loading"></loading>
		<template v-else>
			<mu-row class="nums">
				<template v-if="result.pageInfo">
					<mu-col span="12">
						<div>共{{result.pageInfo.totalResults}}个相关内容</div>
					</mu-col>
					<mu-col span="12">
						<mu-select label="过滤" v-model="rcode" label-float @change="rcodeChange">
							<mu-option
								v-for="option in options"
								:key="option.value"
								:label="option.name"
								:value="option.value"
							></mu-option>
						</mu-select>
					</mu-col>
				</template>

				<mu-col span="12">
					<video-list :items="items"></video-list>
				</mu-col>
			</mu-row>
			<mu-row>
				<mu-col span="12">
					<div class="pages">
						<mu-button
							small
							flat
							color="primary"
							:disabled="disabled"
							v-if="result.prevPageToken"
							@click="prev"
						>上一页</mu-button>
						<mu-button
							small
							flat
							color="primary"
							:disabled="disabled"
							v-if="result.nextPageToken"
							@click="next"
						>下一页</mu-button>
					</div>
				</mu-col>
			</mu-row>
		</template>
	</mu-container>
</template>

<script>
import videoList from "@/components/videoList";
import loading from "@/components/loading";

import { search } from "@/service";

export default {
	components: {
		videoList,
		loading
	},
	data() {
		return {
			disabled: false,
			result: {
				items: []
			},
			rcode: this.$route.query.regionCode,
			options: [
				{
					name: "香港",
					value: "HK"
				},
				{
					name: "台湾",
					value: "TW"
				},
				{
					name: "美国",
					value: "US"
				},
				{
					name: "韩国",
					value: "KR"
				},
				{
					name: "日本",
					value: "JP"
				}
			],
			loading: true
		};
	},
	computed: {
		items() {
			return this.result.items;
		},
		q() {
			return this.$route.query.q;
		},
		page() {
			return this.$route.query.page;
		}
	},
	created() {
		this.doSearch();
	},
	methods: {
		rcodeChange() {
			const name = this.$route.name;
			const query = {
				...this.$route.query,
				...{
					regionCode: this.rcode,
					page: undefined
				}
			};
			this.$router.push({ name, query });
		},
		async doSearch() {
			this.loading = true;
			const pageToken = this.page;
			window.scrollTo(0, 0);
			this.disabled = true;
			const text = this.q;
			const { ok, data } = await search(
				text,
				pageToken,
				undefined,
				this.rcode
			);
			this.disabled = false;
			this.loading = false;
			if (!ok) {
				return;
			}
			this.result = data;
			this.rcode = this.$route.query.regionCode;
		},
		async prev() {
			const name = this.$route.name;
			const query = {
				page: this.result.prevPageToken,
				q: this.q,
				regionCode: this.rcode
			};
			this.$router.push({ name, query });
		},
		async next() {
			const name = this.$route.name;
			const query = {
				page: this.result.nextPageToken,
				q: this.q,
				regionCode: this.rcode
			};
			this.$router.push({ name, query });
		}
	},
	watch: {
		q() {
			this.doSearch();
		},
		page() {
			this.doSearch();
		},
		rcode() {
			this.doSearch();
		}
	}
};
</script>

<style lang="less">
.search-lists {
	margin-top: 80px;
	.nums {
		padding-top: 20px;
	}
	.pages {
		float: right;
		overflow: hidden;
		margin: 60px 0;
	}
}
</style>