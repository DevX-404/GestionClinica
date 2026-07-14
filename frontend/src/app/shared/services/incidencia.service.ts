import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/incidencias`;

  listarTodas(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  listarPorUsuario(idUsuario: number): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`); }
  registrar(idUsuario: number, dto: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/usuario/${idUsuario}`, dto); }
  responder(idIncidencia: number, estado: string, respuestaAdmin: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${idIncidencia}/responder?estado=${estado}`, { respuestaAdmin });
  }
}