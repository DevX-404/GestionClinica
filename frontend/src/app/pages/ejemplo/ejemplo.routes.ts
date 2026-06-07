import { Routes } from '@angular/router';
import { EjemploList } from './ejemplo-list/ejemplo-list';
import { EjemploForm } from './ejemplo-form/ejemplo-form';

export const EJEMPLO_ROUTES: Routes = [
  {
    path: '',
    component: EjemploList // Ruta base: /ejemplo
  },
  {
    path: 'nuevo',
    component: EjemploForm // Ruta para crear: /ejemplo/nuevo
  },
  {
    path: 'editar/:id',
    component: EjemploForm // Ruta para editar: /ejemplo/editar/1
  }
];