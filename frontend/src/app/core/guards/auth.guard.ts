import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true; // Permitir paso
  }

  // Si no está logueado, patitas para la calle al login
  router.navigate(['/login']);
  return false;
};