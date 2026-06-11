import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Validar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Validar control de acceso por roles si la ruta está protegida
  const expectedRoles = route.data['roles'] as string[];
  if (expectedRoles && !authService.hasRole(expectedRoles)) {
    // Si no tiene el rol permitido, redirigir al Dashboard principal
    router.navigate(['/dashboard']); 
    return false;
  }

  return true;
};