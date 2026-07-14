import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaMedicaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/citas`;

  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  listarPorMedico(idMedico: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medico/${idMedico}`);
  }

  programarCita(cita: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cita);
  }

  programarCitaRapida(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rapida`, payload);
  }

  actualizarEstado(idCita: number, nuevoEstado: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${idCita}/estado?nuevoEstado=${nuevoEstado}`, {});
  }

  reprogramarCita(idCita: number, fecha: string, hora: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${idCita}/reprogramar?fecha=${fecha}&hora=${hora}`, {});
  }

  validarHorario(idMedico: number, fecha: string, hora: string, tipoCita: string): Observable<{disponible: boolean}> {
    let params = new HttpParams()
      .set('idMedico', idMedico.toString())
      .set('fecha', fecha)
      .set('hora', hora.length === 5 ? `${hora}:00` : hora) 
      .set('tipoCita', tipoCita);

    return this.http.get<{disponible: boolean}>(`${this.apiUrl}/validar-horario`, { params });
  }

  cancelarConReembolso(idCita: number, motivo: string, evidenciaBase64: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${idCita}/cancelar-con-reembolso?motivo=${motivo}`, { evidenciaBase64 });
  }
}