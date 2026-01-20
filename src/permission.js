import router from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({
  showSpinner: false,
});

const whiteList = ['/login'];

router.beforeEach((to, from, next) => {
  NProgress.start();
  if (true) {
    if (to.path === '/' || to.path === '') {
      next('/index');
      NProgress.done();
    } else {
      next();
      NProgress.done();
    }
  } else {
  }
});

router.afterEach(() => {
  NProgress.done();
});
