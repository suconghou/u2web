import Vue from 'vue'
import App from './App.vue'
import router from './router'
import MuseUI from 'muse-ui';
import Toast from 'muse-ui-toast';
import 'muse-ui/dist/muse-ui.css';

Vue.config.productionTip = false

Vue.use(MuseUI);
Vue.use(Toast);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
