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

  pagosFinalizados: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;
  orden: string = 'LLEGADA_DESC'; 

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
  }

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