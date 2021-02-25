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
		component: () => import(/* webpackChunkName: "page" */ '../views/Video.vue')
	},
	{
		path: '/channel/:id',
		name: 'channel',
		component: () => import(/* webpackChunkName: "page" */ '../views/Channel.vue'),
		children: [
			{
				path: 'uploads',
				name: 'channel.uploads',
				component: () => import(/* webpackChunkName: "page" */ '../views/channel/Uploads.vue'),
			},
			{
				path: 'favorites',
				name: 'channel.fav',
				component: () => import(/* webpackChunkName: "page" */ '../views/channel/Favorites.vue'),
			},
			{
				path: 'playlist',
				name: 'channel.list',
				component: () => import(/* webpackChunkName: "page" */ '../views/channel/Playlist.vue'),
				children: [
					{
						path: ':listId',
						name: 'channel.list.items',
						component: () => import(/* webpackChunkName: "page" */ '../views/channel/PlaylistItems.vue'),
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

router.afterEach((to, from) => {
	if (window._hmt && typeof window._hmt.push == 'function') {
		window._hmt.push(['_trackPageview', to.fullPath])
	}
});

export default router
