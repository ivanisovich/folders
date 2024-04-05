import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from "../components/Login.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true } // Требует аутентификации для доступа
    },
    {
      path: '/login',
      name: 'login',
      component: Login // Маршрут для страницы входа
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: true } // Требует аутентификации для доступа
    }
  ]
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken');
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
