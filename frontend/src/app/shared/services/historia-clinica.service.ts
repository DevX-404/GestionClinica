import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {
  private apiUrl = 'http://localhost:8080/api/historias';

  constructor(private http: HttpClient) {}

  // 1. Sirve para la pantalla general (Listar todos los expedientes)
  obtenerTodosLosExpedientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Sirve para ver el expediente de un paciente específico en la Agenda
  obtenerPorPaciente(idPaciente: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/paciente/${idPaciente}`);
  }

  // 3. Sirve para crear el expediente vacío cuando le das a guardar por primera vez
  inicializarHistoria(idPaciente: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/paciente/${idPaciente}/inicializar`, {});
  }

  // 4. Sirve para el "lapicito" (Editar Alergias y Antecedentes)
  actualizarFichaGeneral(idHistoria: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idHistoria}`, datos);
  }
}