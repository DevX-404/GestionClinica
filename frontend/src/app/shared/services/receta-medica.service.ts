import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecetaMedicaDTO } from '../models/receta-medica.model';

@Injectable({
  providedIn: 'root'
})
export class RecetaMedicaService {
  private apiUrl = 'http://localhost:8080/api/recetas'; 

  constructor(private http: HttpClient) { }

  // Flujo del médico: Generar la receta ligada a la consulta
  generarReceta(receta: RecetaMedicaDTO): Observable<RecetaMedicaDTO> {
    return this.http.post<RecetaMedicaDTO>(this.apiUrl, receta);
  }

  obtenerPorConsulta(idConsulta: number): Observable<RecetaMedicaDTO> {
    return this.http.get<RecetaMedicaDTO>(`${this.apiUrl}/consulta/${idConsulta}`);
  }

  // EL NUEVO MÉTODO PARA ANGULAR
  listarTodas(): Observable<RecetaMedicaDTO[]> {
    return this.http.get<RecetaMedicaDTO[]>(this.apiUrl);
  }
}