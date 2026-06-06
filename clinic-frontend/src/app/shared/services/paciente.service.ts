import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  // Ruta de tu API REST de Spring Boot
  private apiUrl = 'http://localhost:8080/api/pacientes';

  constructor(private http: HttpClient) {}

  // Consumir el endpoint GET que creamos en el backend
  listarTodos(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }

  registrar(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente);
  }

  actualizar(id: number, paciente: Paciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}`, paciente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}