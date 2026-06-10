import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../shared/services/pago.service';
import { Pago } from '../../shared/models/pago.model';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  providers: [CurrencyPipe] // Para formatear los precios a "S/ 150.00"
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);

  pagos: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Modal para Procesar Pago
  isPaymentModalOpen: boolean = false;
  pagoSeleccionado?: Pago;
  errorMsg: string = '';
  
  // Formulario temporal para procesar el cobro
  cobroForm = {
    metodoPago: 'EFECTIVO',
    tipoComprobante: 'BOLETA'
  };

  // Modal para Ver Recibo (Factura/Boleta)
  isReceiptModalOpen: boolean = false;

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.isLoading = true;
    this.pagoService.listarTodos().subscribe({
      next: (data) => {
        this.pagos = data;
        this.pagosFiltrados = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al conectar con el servidor financiero.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.pagosFiltrados = this.pagos.filter(p => 
      p.nombrePaciente?.toLowerCase().includes(term) ||
      p.numeroComprobante?.toLowerCase().includes(term) ||
      p.estadoPago.toLowerCase().includes(term)
    );
  }

  // --- FLUJO: PROCESAR PAGO ---
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
        this.cargarPagos(); // Recargar la tabla
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Ocurrió un error al procesar la transacción.';
      }
    });
  }

  // --- FLUJO: VER COMPROBANTE ---
  openReceiptModal(pago: Pago): void {
    this.pagoSeleccionado = pago;
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal(): void {
    this.isReceiptModalOpen = false;
    this.pagoSeleccionado = undefined;
  }

  imprimirRecibo(): void {
    window.print(); // Solución rápida nativa del navegador para imprimir el área visible
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000);
  }
}