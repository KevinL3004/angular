import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modulo = route.data['modulo'] as string;

  if (auth.tienePermiso(modulo)) return true;

  router.navigate(['/dashboard']);
  return false;
};