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
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - Sistema Médico'
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent),
        title: 'Gestión de Pacientes'
      },
      {
        path: 'medicos',
        loadComponent: () => import('./pages/medicos/medicos.component').then(m => m.MedicosComponent),
        title: 'Gestión de Médicos'
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
        title: 'Mi Perfil'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];