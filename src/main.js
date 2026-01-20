import { createApp } from 'vue';

// 引入ElementPlus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import '@/assets/styles/index.scss'; // global css
import '@/assets/font/font.css'; //自定义字体

import App from './App.vue';
import store from './store';
import router from './router';

import './permission'; // permission control

const app = createApp(App);

app.use(router);
app.use(store);
app.use(ElementPlus);

app.mount('#app');
