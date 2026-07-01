import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitaMedicaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/citas';

  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  listarPorMedico(idMedico: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medico/${idMedico}`);
  }

  programarCita(cita: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cita);
  }

  actualizarEstado(idCita: number, nuevoEstado: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${idCita}/estado?nuevoEstado=${nuevoEstado}`, {});
  }

  validarHorario(idMedico: number, fecha: string, hora: string, tipoCita: string): Observable<{disponible: boolean}> {
    let params = new HttpParams()
      .set('idMedico', idMedico.toString())
      .set('fecha', fecha)
      .set('hora', hora.length === 5 ? `${hora}:00` : hora) 
      .set('tipoCita', tipoCita);

    return this.http.get<{disponible: boolean}>(`${this.apiUrl}/validar-horario`, { params });
  }
}