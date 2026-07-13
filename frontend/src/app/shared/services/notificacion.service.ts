import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/notificaciones';

  listarMisNotificaciones(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  marcarComoLeida(idNotificacion: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${idNotificacion}/leer`, {});
  }
}