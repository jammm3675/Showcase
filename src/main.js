import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import TonConnectUI from '@ton-connect/ui-vue';
import './assets/main.css'

const app = createApp(App)

app.use(router)

// Initialize and register the TonConnectUI plugin
app.use(TonConnectUI, {
  manifestUrl: '/tonconnect-manifest.json', // The path to the manifest file in the 'public' dir
});


app.mount('#app')
