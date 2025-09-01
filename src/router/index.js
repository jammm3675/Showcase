import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchView
  },
  {
    path: '/profile/:telegram_id?',
    name: 'Profile',
    component: ProfileView,
    props: true // This allows route params to be passed as props to the component
  }
]

const router = createRouter({
  // Using hash history is robust for embedded web apps like Telegram Mini Apps
  history: createWebHashHistory(),
  routes
})

export default router
