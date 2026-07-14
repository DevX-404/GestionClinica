import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  listarTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerPerfil(username: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil/${username}`);
  }
  
  cambiarEstado(idUsuario: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${idUsuario}/estado`, {});
  }

  cambiarRol(idUsuario: number, nuevoRol: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${idUsuario}/rol?nuevoRol=${nuevoRol}`, {});
  }

  restablecerPassword(idUsuario: number, nuevaPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idUsuario}/reset-password`, { nuevaPassword });
  }

  cambiarPasswordPerfil(username: string, passwordActual: string, nuevaPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/perfil/${username}/cambiar-password`, { passwordActual, nuevaPassword });
  }

  crear(usuario: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario);
  }

  actualizar(idUsuario: number, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idUsuario}`, usuario);
  }
}