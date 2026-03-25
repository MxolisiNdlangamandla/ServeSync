import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const token = localStorage.getItem('servesync-token');
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const profile = auth.profile() ?? await auth.ensureProfile();
  if (profile && ['admin', 'manager', 'supervisor'].includes(profile.role)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};