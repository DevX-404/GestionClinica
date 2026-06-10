import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CitaMedica } from '../models/cita-medica.model';

@Injectable({
  providedIn: 'root'
})
export class CitaMedicaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/citas';

  listarTodas(): Observable<CitaMedica[]> {
    return this.http.get<CitaMedica[]>(this.apiUrl);
  }

  listarPorMedico(idMedico: number): Observable<CitaMedica[]> {
    return this.http.get<CitaMedica[]>(`${this.apiUrl}/medico/${idMedico}`);
  }

  programarCita(cita: CitaMedica): Observable<CitaMedica> {
    return this.http.post<CitaMedica>(this.apiUrl, cita);
  }

  actualizarEstado(idCita: number, nuevoEstado: string): Observable<CitaMedica> {
    // Usamos patch como lo tienes en el backend: @PatchMapping("/{id}/estado")
    return this.http.patch<CitaMedica>(`${this.apiUrl}/${idCita}/estado?nuevoEstado=${nuevoEstado}`, {});
  }
}