import routes from './routes.js';
import { addToast } from './util.js';

export const store = Vue.reactive({
    dark: localStorage.getItem('dark') !== null
    ? JSON.parse(localStorage.getItem('dark'))
    : true,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
        addToast(this.dark ? 'Dark mode enabled' : 'Warning: as of v1.2.1, light mode has been deprecated! Page may not display correctly');
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');
