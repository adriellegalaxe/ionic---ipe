import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.logado) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.isAdmin) return true;
  router.navigate(['/acesso-restrito']);
  return false;
};

/** Páginas de login/cadastro: se já estiver logado, vai para a home. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.logado) return true;
  router.navigate(['/home']);
  return false;
};
