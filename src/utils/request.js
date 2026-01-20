// import axios from 'axios';

// // 是否显示重新登录
// export let isRelogin = { show: false };

// axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
// // 创建axios实例
// const service = axios.create({
//   // axios中请求配置有baseURL选项，表示请求URL公共部分
//   baseURL: getBaseUrl(),

//   // 超时
//   timeout: 1000 * 60,
// });

// export function getBaseUrl() {
//   const url = window.location.origin;
//   const newUrl = ['localhost', '127.0.0.1'].filter((item) => url.indexOf(item) > -1).length > 0 ? import.meta.env.VITE_APP_BASE_API : url;
//   return newUrl;
// }
// // request拦截器
// service.interceptors.request.use(
//   (config) => {
//     // 是否需要设置 token
//     const isToken = (config.headers || {}).isToken === false;
//     // 是否需要防止数据重复提交
//     const isRepeatSubmit = (config.headers || {}).repeatSubmit === false;
//     // if (getToken() && !isToken) {
//     //   config.headers['Authentication'] = getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
//     // }
//     // get请求映射params参数
//     if (config.method === 'get' && config.params) {
//       let url = config.url + '?' + tansParams(config.params);
//       url = url.slice(0, -1);
//       config.params = {};
//       config.url = url;
//     }
//     if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
//       const requestObj = {
//         url: config.url,
//         data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
//         time: new Date().getTime(),
//       };
//       const requestSize = Object.keys(JSON.stringify(requestObj)).length; // 请求数据大小
//       const limitSize = 5 * 1024 * 1024; // 限制存放数据5M
//       if (requestSize >= limitSize) {
//         console.warn(`[${config.url}]: ` + '请求数据大小超出允许的5M限制，无法进行防重复提交验证。');
//         return config;
//       }
//       const sessionObj = cache.session.getJSON('sessionObj');
//       if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
//         cache.session.setJSON('sessionObj', requestObj);
//       } else {
//         const s_url = sessionObj.url; // 请求地址
//         const s_data = sessionObj.data; // 请求数据
//         const s_time = sessionObj.time; // 请求时间
//         const interval = 1000; // 间隔时间(ms)，小于此时间视为重复提交
//         if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
//           const message = '数据正在处理，请勿重复提交';
//           console.warn(`[${s_url}]: ` + message);
//           return Promise.reject(new Error(message));
//         } else {
//           cache.session.setJSON('sessionObj', requestObj);
//         }
//       }
//     }
//     return config;
//   },
//   (error) => {
//     console.log(error);
//     Promise.reject(error);
//   }
// );

// // 响应拦截器
// service.interceptors.response.use(
//   (res) => {
//     // 未设置状态码则默认成功状态
//     const code = res.data.code || '000000';
//     // 获取错误信息
//     const msg = errorCode[code] || res.data.description || errorCode['default'];
//     // 二进制数据则直接返回
//     if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
//       return res.data;
//     }
//     if (code === '700001' || code === '700002' || code === '700003') {
//       // isRelogin.show = false;
//       if (!isRelogin.show) {
//         isRelogin.show = true;
//         setTimeout(() => {
//           isRelogin.show = false;
//           useUserStore()
//             .logOut()
//             .then(() => {
//               location.href = '/index';
//             });
//         }, 3000);
//         // ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', { confirmButtonText: '重新登录', cancelButtonText: '取消', type: 'warning' })
//         //   .then(() => {
//         //     isRelogin.show = false;
//         //     useUserStore()
//         //       .logOut()
//         //       .then(() => {
//         //         location.href = '/index';
//         //       });
//         //   })
//         //   .catch(() => {
//         //     isRelogin.show = false;
//         //   });
//       }
//       return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
//     } else if (code !== '000000') {
//       ElNotification.error({ title: msg });
//       return Promise.reject('error');
//     } else {
//       return Promise.resolve(res.data);
//     }
//   },
//   (error) => {
//     console.log('err' + error);
//     let { message } = error;
//     if (message == 'Network Error') {
//       message = '后端接口连接异常';
//     } else if (message.includes('timeout')) {
//       message = '系统接口请求超时';
//     } else if (message.includes('Request failed with status code')) {
//       message = '系统接口' + message.substr(message.length - 3) + '异常';
//     }
//     ElMessage({ message: message, type: 'error', duration: 5 * 1000 });
//     return Promise.reject(error);
//   }
// );

// export default service;
