import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../shared/services/pago.service';
import { Pago } from '../../shared/models/pago.model';

@Component({
  selector: 'app-historial-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-caja.component.html',
  providers: [CurrencyPipe]
})
export class HistorialCajaComponent implements OnInit {
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  // DATOS
  pagosFinalizados: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  pagosPaginados: Pago[] = []; // NUEVO: Para la paginación de la tabla
  
  // CONTROLES DE LA TABLA Y BÚSQUEDA
  searchTerm: string = '';
  orden: string = 'LLEGADA_DESC'; 
  itemsPorPagina: number = 5;
  paginaActual: number = 1;

  isLoading: boolean = false;

  // Modal Recibo
  isReceiptModalOpen: boolean = false;
  pagoSeleccionado?: Pago;

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.pagoService.listarTodos().subscribe({
      next: (data) => {
        // FILTRO ESTRICTO: Solo aceptamos pagos completados
        this.pagosFinalizados = data.filter(p => p.estadoPago === 'PAGADO' || p.estadoPago === 'COMPLETADO');
        this.aplicarFiltros(); 
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- BUSCADOR Y ORDENAMIENTO CORREGIDOS ---
  aplicarFiltros(): void {
    let temp = [...this.pagosFinalizados];

    // Búsqueda Inteligente
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(p => 
        (p.nombrePaciente && p.nombrePaciente.toLowerCase().includes(term)) ||
        (p.numeroComprobante && p.numeroComprobante.toLowerCase().includes(term)) ||
        (p.dniPaciente && p.dniPaciente.includes(term)) ||
        (p.nombreEspecialidad && p.nombreEspecialidad.toLowerCase().includes(term)) ||
        (p.nombreMedico && p.nombreMedico.toLowerCase().includes(term))
      );
    }

    // Ordenamiento
    temp.sort((a, b) => {
      const dateA = new Date(`${a.fechaPago || '1970-01-01'}T${a.horaPago || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.fechaPago || '1970-01-01'}T${b.horaPago || '00:00:00'}`).getTime();
      return this.orden === 'LLEGADA_DESC' ? dateB - dateA : dateA - dateB;
    });

    this.pagosFiltrados = temp;

    // Regresamos a la primera página tras buscar u ordenar y actualizamos tabla
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.pagosPaginados = this.pagosFiltrados.slice(inicio, fin);
  }

  cambiarPaginacion(): void {
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  paginaSiguiente(): void {
    if ((this.paginaActual * this.itemsPorPagina) < this.pagosFiltrados.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.pagosFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.pagosFiltrados.length ? this.pagosFiltrados.length : fin;
  }
  // --- FIN LÓGICA DE PAGINACIÓN ---

  openReceiptModal(pago: Pago): void {
    this.pagoSeleccionado = pago;
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal(): void {
    this.isReceiptModalOpen = false;
    this.pagoSeleccionado = undefined;
  }

  imprimirRecibo(): void {
    window.print();
  }
}