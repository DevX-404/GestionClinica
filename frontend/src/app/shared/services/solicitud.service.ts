import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/solicitudes`;

  listarTodas(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  listarPorUsuario(idUsuario: number): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`); }
  crear(idUsuario: number, solicitud: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/usuario/${idUsuario}`, solicitud); }
  responder(idSolicitud: number, estado: string, respuesta: string): Observable<any> { 
    return this.http.patch<any>(`${this.apiUrl}/${idSolicitud}/responder?estado=${estado}`, respuesta); 
  }
}