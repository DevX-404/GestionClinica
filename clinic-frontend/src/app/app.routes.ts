import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
        title: 'Dashboard - Sistema Médico'
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/pacientes/pacientes').then(m => m.Pacientes),
        title: 'Gestión de Pacientes'
      },
      {
        path: 'medicos',
        loadComponent: () => import('./pages/medicos/medicos').then(m => m.Medicos),
        title: 'Gestión de Médicos'
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil),
        title: 'Mi Perfil'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
    title: 'Iniciar Sesión'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];