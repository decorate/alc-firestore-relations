import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { SetUpFirestore } from './entities/SetUpFirestore'
import config from './private/config.json'

Vue.config.productionTip = false

new SetUpFirestore(config)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
