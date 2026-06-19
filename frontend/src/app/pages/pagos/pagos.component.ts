import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../shared/services/pago.service';
import { Pago } from '../../shared/models/pago.model';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  providers: [CurrencyPipe]
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  pagos: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Filtros de visualización
  filtroEstado: string = 'TODOS'; // Opciones: 'TODOS', 'PENDIENTE', 'ATENDIDA'
  orden: string = 'LLEGADA_DESC'; 

  // Modal para Procesar Pago
  isPaymentModalOpen: boolean = false;
  pagoSeleccionado?: Pago;
  errorMsg: string = '';
  
  cobroForm = {
    metodoPago: 'EFECTIVO',
    tipoComprobante: 'BOLETA'
  };

  isReceiptModalOpen: boolean = false;

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.pagoService.listarTodos().subscribe({
      next: (data) => {
        this.pagos = data;
        this.aplicarFiltros(); 
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al conectar con el servidor financiero.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    let temp = [...this.pagos];

    // --- MAGIA AQUÍ: Filtramos para que NUNCA muestre los pagos ya cancelados ---
    temp = temp.filter(p => p.estadoPago === 'PENDIENTE' || p.estadoPago === 'Por Cobrar');

    // 1. Filtro por término de búsqueda (Nombre, Comprobante, DNI o Especialidad)
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

    // 2. Filtro avanzado por Estados combinados (Pago + Consulta Médica)
    if (this.filtroEstado !== 'TODOS') {
      if (this.filtroEstado === 'PENDIENTE') {
        // Por Cobrar que aún no entran a consulta médica
        temp = temp.filter(p => p.estadoCita !== 'ATENDIDA');
      } else if (this.filtroEstado === 'ATENDIDA') {
        // Citas ya atendidas por el doctor que están pendientes de pago en caja
        temp = temp.filter(p => p.estadoCita === 'ATENDIDA');
      }
    }

    // 3. Ordenamiento cronológico por fecha y hora de registro
    temp.sort((a, b) => {
      const dateA = new Date(`${a.fechaPago || '1970-01-01'}T${a.horaPago || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.fechaPago || '1970-01-01'}T${b.horaPago || '00:00:00'}`).getTime();
      
      if (this.orden === 'LLEGADA_DESC') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    this.pagosFiltrados = temp;
  }

  openPaymentModal(pago: Pago): void {
    this.pagoSeleccionado = pago;
    this.errorMsg = '';
    this.cobroForm = { metodoPago: 'EFECTIVO', tipoComprobante: 'BOLETA' };
    this.isPaymentModalOpen = true;
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen = false;
    this.pagoSeleccionado = undefined;
  }

  confirmarCobro(): void {
    if (!this.pagoSeleccionado || !this.pagoSeleccionado.idPago) return;

    const payload: Partial<Pago> = {
      metodoPago: this.cobroForm.metodoPago,
      tipoComprobante: this.cobroForm.tipoComprobante
    };

    this.pagoService.procesarPago(this.pagoSeleccionado.idPago, payload).subscribe({
      next: () => {
        this.closePaymentModal();
        this.mostrarMensajeGlobal('Pago procesado y comprobante generado con éxito.', 'success');
        this.cargarPagos(); 
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Ocurrió un error al procesar la transacción.';
        this.cdr.detectChanges();
      }
    });
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

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}