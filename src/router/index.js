import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

import Layout from '@/layout/index.vue';

// 路由信息
export const constantRoutes = [
  //首页
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/index.vue'),
      },
    ],
  },
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes: constantRoutes,
  // 路由滚动行为处理函数
  scrollBehavior(to, from, savedPosition) {
    // 如果存在保存的滚动位置，则恢复到该位置
    if (savedPosition) {
      return savedPosition;
    }
    // 默认滚动到页面顶部
    return { top: 0 };
  },
});

export default router;
