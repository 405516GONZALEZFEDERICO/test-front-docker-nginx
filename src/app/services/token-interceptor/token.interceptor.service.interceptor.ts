import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../login-service/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  
  if (req.url.includes('/login') || req.url.includes('/refresh') ) {
    return next(req);
  }

  let accessToken = auth.getToken();

  if (accessToken && auth.isTokenExpired(accessToken)) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      return auth.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newAccessToken = auth.getToken();
      
          const newReq = req.clone({
            setHeaders: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          });
          return next(newReq);
        }),
        catchError(error => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => error);
        })
      );
      
    }
  }

  if (accessToken) {
    req = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        return auth.refreshToken().pipe(
          switchMap(tokens => {
            isRefreshing = false;
            const newReq = req.clone({
              setHeaders: {
                'Authorization': `Bearer ${tokens.access_token}`
              }
            });
            return next(newReq);
          }),
          catchError(refreshError => {
            isRefreshing = false;
            auth.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};