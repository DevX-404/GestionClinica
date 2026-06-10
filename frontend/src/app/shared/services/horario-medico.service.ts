import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorarioMedico } from '../models/horario-medico.model';

@Injectable({
  providedIn: 'root'
})
export class HorarioMedicoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/horarios';

  listarPorMedico(idMedico: number): Observable<HorarioMedico[]> {
    return this.http.get<HorarioMedico[]>(`${this.apiUrl}/medico/${idMedico}`);
  }

  registrar(horario: HorarioMedico): Observable<HorarioMedico> {
    return this.http.post<HorarioMedico>(this.apiUrl, horario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}