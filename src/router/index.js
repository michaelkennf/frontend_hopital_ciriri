import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Login', component: () => import('../pages/Login.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../pages/Dashboard.vue') },
  { path: '/patients', name: 'Patients', component: () => import('../pages/Patients.vue') },
  { path: '/medicaments', name: 'Medicaments', component: () => import('../pages/Medicaments.vue') },
  { path: '/personnel', name: 'Personnel', component: () => import('../pages/Personnel.vue') },
  { path: '/facturation', name: 'Facturation', component: () => import('../pages/Facturation.vue') },
  { path: '/depenses', name: 'Depenses', component: () => import('../pages/Depenses.vue') },
  { path: '/activites', name: 'Activites', component: () => import('../pages/Activites.vue') },
  { path: '/demandes', name: 'Demandes', component: () => import('../pages/Demandes.vue') },
  { path: '/parametres', name: 'Parametres', component: () => import('../pages/Parametres.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router