import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/video/:id', name: 'video', component: () => import('@/views/VideoView.vue') },
    {
      path: '/channel/:id',
      name: 'channel',
      // /channel/:id 默认进入"上传的"子页
      redirect: (to) => ({ name: 'channel.uploads', params: { id: to.params.id } }),
      component: () => import('@/views/ChannelView.vue'),
      children: [
        { path: 'uploads', name: 'channel.uploads', component: () => import('@/views/channel/UploadsView.vue') },
        { path: 'favorites', name: 'channel.fav', component: () => import('@/views/channel/FavoritesView.vue') },
        {
          path: 'playlist',
          name: 'channel.list',
          component: () => import('@/views/channel/PlaylistView.vue'),
          children: [
            {
              path: ':listId',
              name: 'channel.list.items',
              component: () => import('@/views/channel/PlaylistItemsView.vue'),
            },
          ],
        },
      ],
    },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/setting', name: 'setting', component: () => import('@/views/SettingView.vue') },
    { path: '/chat', name: 'chat', component: () => import('@/views/ChatView.vue') },
    { path: '/play', name: 'play', component: () => import('@/views/PlayView.vue') },
    { path: '/:pathMatch(.*)*', name: 'err404', component: () => import('@/views/NotFoundView.vue') },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

export default router
