import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
        title: 'Iniciar Sesión'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/ecommerce/ecommerce.component').then(
            (m) => m.EcommerceComponent
          )
      },
      // Aquí agregaremos en los siguientes pasos los hijos de 'pacientes' y 'medicos'
      {
        path: 'ejemplo',
        loadChildren: () =>
          import('./pages/ejemplo/ejemplo.routes').then((m) => m.EJEMPLO_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard' // Comodín para redirigir cualquier ruta inexistente por ahora
  }
];