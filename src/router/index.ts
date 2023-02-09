// Composables
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// Auto generates routes from vue files under ./pages
// https://vitejs.dev/guide/features.html#glob-import
const pages = import.meta.glob('../pages/*.vue')

const childRoutes: RouteRecordRaw[] = Object.keys(pages).map((path) => {
  const name = path.match(/\.\.\/pages(.*)\.vue$/)![1].toLowerCase()
  return {
    path: name === '/airband' ? '/' : name,
    component: pages[path] // () => import('./pages/*.vue')
  }
})

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: childRoutes
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
