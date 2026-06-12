import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/usuarios';

  listarTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
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

  crear(usuario: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario);
  }

  actualizar(idUsuario: number, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idUsuario}`, usuario);
  }
}