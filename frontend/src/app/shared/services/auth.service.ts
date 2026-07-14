import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  username: string; 
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  rol: string;
  modulos: string[];
  nombreReal: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/auth';

  // Le agregamos el parámetro "mantenerSesion"
  login(credentials: LoginRequest, mantenerSesion: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.clear();
        sessionStorage.clear();

        const storage = mantenerSesion ? localStorage : sessionStorage;

        storage.setItem('token', response.token);
        storage.setItem('username', response.username);
        storage.setItem('rol', response.rol.toUpperCase()); 
        storage.setItem('nombreReal', response.nombreReal);
        storage.setItem('modulos', JSON.stringify(response.modulos || []));
      })
    );
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // Buscamos en ambos storages
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('rol') || sessionStorage.getItem('rol');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(allowedRoles: string[]): boolean {
    const userRole = this.getRole();
    if (!userRole) return false;
    return allowedRoles.map(r => r.toUpperCase()).includes(userRole);
  }
}