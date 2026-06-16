import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { RecetasComponent } from './pages/recetas/recetas.component';

export const routes: Routes = [
  // 1. Ruta pública e independiente (A pantalla completa, sin Sidebar ni Header)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - Gestión Clínica'
  },

  // 2. Rutas protegidas dentro del Layout de la Clínica (Llevan Sidebar, Header y Navbar)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard], // Protege todo este bloque de accesos no autorizados
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/ecommerce/ecommerce.component').then(m => m.EcommerceComponent),
        title: 'Dashboard - Panel de Control'
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/pacientes/pacientes').then(m => m.PacientesComponent),
        title: 'Pacientes'
      },
      {
        path: 'medicos',
        loadComponent: () => import('./pages/medicos/medicos.component').then(m => m.MedicosComponent),
        title: 'Médicos'
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./pages/especialidades/especialidades.component').then(m => m.EspecialidadesComponent),
        title: 'Especialidades'
      },
      {
        path: 'agenda',
        loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent),
        title: 'Agenda Médica'
      },
      {
        path: 'citas',
        loadComponent: () => import('./pages/citas/citas.component').then(m => m.CitasComponent),
        title: 'Citas Médicas'
      },
      {
        path: 'pagos',
        loadComponent: () => import('./pages/pagos/pagos.component').then(m => m.PagosComponent),
        title: 'Pagos'
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./pages/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
        title: 'Registro de Auditoría'
      },
      
      {
        path: 'seguridad',
        loadComponent: () => import('./pages/seguridad/seguridad.component').then(m => m.SeguridadComponent),
        title: 'Seguridad y Usuarios'
      },
      {
        path: 'recetas',
        component: RecetasComponent,
        title: 'Recetas Médicas'
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