import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaMedicaService {
  // Ajusta el puerto si tu Spring Boot corre en uno distinto al 8080
  private apiUrl = 'http://localhost:8080/api/consultas'; 

  constructor(private http: HttpClient) { }

  // Flujo del médico: Atender la cita
  atenderCita(idCita: number, datosConsulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/atender-cita/${idCita}`, datosConsulta);
  }

  // Ver historial
  obtenerPorPaciente(idPaciente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${idPaciente}`);
  }
}