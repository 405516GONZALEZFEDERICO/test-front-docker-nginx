import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { TokenResponseDto, User } from '../../interfaces/auth';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private baseUrl = environment.apis.be;

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  getRefreshTokenValidator(): string {
    return this.cookieService.get('refresh_token');
  }

  login(credentials: { email: string; password: string }): Observable<TokenResponseDto> {
    return this.http.post<TokenResponseDto>(`${this.baseUrl}auth/login`, credentials).pipe(
      tap(response => {
        this.cookieService.set('access_token', response.access_token, { secure: true, sameSite: 'Strict' });
        this.cookieService.set('refresh_token', response.refresh_token, { secure: true, sameSite: 'Strict' });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || 'Error de autenticación';
        return throwError(() => ({
          status: error.status,
          error: {
            message: errorMessage
          }
        }));
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}user/getUsers`).pipe(
      tap(response => {}),
      catchError(error => {
        return of([]);
      })
    );
  }

  getUserNameFromToken(): string {
    const token = this.cookieService.get('access_token');
    if (!token) return '';
    
    const decodedToken = this.decodeToken(token);
    if (!decodedToken) return '';
    return decodedToken.name || '';
  }

  isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    if (!decodedToken) return true;
    const expirationDate = new Date(decodedToken.exp * 1000);
    const currentDate = new Date();
    return expirationDate <= currentDate;
  }

  refreshToken(): Observable<TokenResponseDto> {
    const refreshToken = this.cookieService.get('refresh_token');
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
  
    return this.http.post<TokenResponseDto>(`${this.baseUrl}auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    }).pipe(
      tap(response => {
        this.cookieService.set('access_token', response.access_token, { secure: true, sameSite: 'Strict' });
        this.cookieService.set('refresh_token', response.refresh_token, { secure: true, sameSite: 'Strict' });
      })
    );
  }

  register(userData: { name: string; email: string; password: string }): Observable<TokenResponseDto> {
    return this.http.post<TokenResponseDto>(`${this.baseUrl}auth/register`, userData).pipe(
      tap(response => {
        this.cookieService.set('access_token', response.access_token, { secure: true, sameSite: 'Strict' });
        this.cookieService.set('refresh_token', response.refresh_token, { secure: true, sameSite: 'Strict' });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || 'Error en el registro';
        return throwError(() => ({
          status: error.status,
          error: {
            message: errorMessage
          }
        }));
      })
    );
  }

  logout(): void {
    this.cookieService.delete('access_token');
    this.cookieService.delete('refresh_token');
  }

  isAuthenticated(): boolean {
    const hasAccessToken = this.cookieService.check('access_token');
    const hasRefreshToken = this.cookieService.check('refresh_token');
    return hasAccessToken || hasRefreshToken;
  }

  getToken(): string {
    return this.cookieService.get('access_token');
  }
}