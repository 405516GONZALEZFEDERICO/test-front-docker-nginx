import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/login-service/auth.service';
import { catchError, map, Observable, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return of(true); 
  } 

  const refreshToken = authService.getRefreshTokenValidator();
  if (refreshToken && !authService.isTokenExpired(refreshToken)) {
    return authService.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return of(false); 
}

