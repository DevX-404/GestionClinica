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