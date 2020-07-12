import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import(/* webpackChunkName: "page" */ '../views/Home.vue')
	},
	{
		path: '/about',
		name: 'about',
		component: () => import(/* webpackChunkName: "page" */ '../views/About.vue')
	},
	{
		path: '/video/:id',
		name: 'video',
		component: () => import(/* webpackChunkName: "video" */ '../views/Video.vue')
	},
	{
		path: '/channel/:id',
		name: 'channel',
		component: () => import(/* webpackChunkName: "channel" */ '../views/Channel.vue'),
		children: [
			{
				path: 'uploads',
				name: 'channel.uploads',
				component: () => import(/* webpackChunkName: "channel" */ '../views/channel/Uploads.vue'),
			},
			{
				path: 'favorites',
				name: 'channel.fav',
				component: () => import(/* webpackChunkName: "channel" */ '../views/channel/Favorites.vue'),
			},
			{
				path: 'playlist',
				name: 'channel.list',
				component: () => import(/* webpackChunkName: "channel" */ '../views/channel/Playlist.vue'),
				children: [
					{
						path: ':listId',
						name: 'channel.list.items',
						component: () => import(/* webpackChunkName: "channel" */ '../views/channel/PlaylistItems.vue'),
					}
				]
			}
		]
	},
	{
		path: '/search',
		name: 'search',
		component: () => import(/* webpackChunkName: "page" */ '../views/Search.vue')
	},
	{
		path: '/setting',
		name: 'setting',
		component: () => import(/* webpackChunkName: "page" */ '../views/Setting.vue')
	},
	{
		path: '/chat',
		name: 'chat',
		component: () => import(/* webpackChunkName: "page" */ '../views/Chat.vue')
	},
	{
		path: '*',
		name: 'err404',
		component: () => import(/* webpackChunkName: "page" */ '../views/Err404.vue')
	}
]

const router = new VueRouter({
	mode: 'history',
	base: '',
	routes
})

export default router
