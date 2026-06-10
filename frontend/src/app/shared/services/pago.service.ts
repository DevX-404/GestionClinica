import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pago } from '../models/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/pagos';

  listarTodos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.apiUrl);
  }

  obtenerPorCita(idCita: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/cita/${idCita}`);
  }

  generarPagoPendiente(idCita: number): Observable<Pago> {
    return this.http.post<Pago>(`${this.apiUrl}/generar/${idCita}`, {});
  }

  procesarPago(idPago: number, datosPago: Partial<Pago>): Observable<Pago> {
    return this.http.post<Pago>(`${this.apiUrl}/procesar/${idPago}`, datosPago);
  }
}