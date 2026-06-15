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
  providers: [CurrencyPipe] // Para formatear los precios a "S/ 150.00"
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  pagos: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  
  // Variables generales de la tabla y busqueda
  searchTerm: string = '';
  isLoading: boolean = false;
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Nuevas variables para los filtros de la interfaz
  filtroEstado: string = 'TODOS'; 
  orden: string = 'LLEGADA_DESC'; 

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
    this.cdr.detectChanges();

    this.pagoService.listarTodos().subscribe({
      next: (data) => {
        this.pagos = data;
        // Ahora, en lugar de solo copiar los datos, llamamos a aplicarFiltros
        // para que ordene automaticamente los datos apenas llegan del backend.
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

  // Se reemplaza la antigua funcion filtrar() por esta funcion centralizada
  // que maneja la busqueda por texto, el filtro por estado y el ordenamiento por fecha/hora.
  aplicarFiltros(): void {
    let temp = [...this.pagos];

    // 1. Busqueda por texto (Nombre paciente, Numero de comprobante o DNI)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(p => 
        (p.nombrePaciente && p.nombrePaciente.toLowerCase().includes(term)) ||
        (p.numeroComprobante && p.numeroComprobante.toLowerCase().includes(term)) ||
        (p.estadoPago && p.estadoPago.toLowerCase().includes(term)) ||
        // Usamos (p as any) por si tu archivo pago.model.ts aun no tiene declarado dniPaciente
        ((p as any).dniPaciente && (p as any).dniPaciente.includes(term))
      );
    }

    // 2. Filtro por Estado (Pendientes vs Pagados)
    if (this.filtroEstado !== 'TODOS') {
      if (this.filtroEstado === 'PENDIENTE') {
        temp = temp.filter(p => p.estadoPago === 'PENDIENTE' || p.estadoPago === 'Por Cobrar');
      } else if (this.filtroEstado === 'PAGADO') {
        temp = temp.filter(p => p.estadoPago === 'PAGADO' || p.estadoPago === 'COMPLETADO');
      }
    }

    // 3. Orden de Llegada (Combinando Fecha y Hora)
    temp.sort((a, b) => {
      // Se concatena la fecha y la hora para crear un objeto Date valido. 
      // Si la hora es nula, se usa 00:00:00 por defecto.
      const dateA = new Date(`${a.fechaPago || '1970-01-01'}T${(a as any).horaPago || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.fechaPago || '1970-01-01'}T${(b as any).horaPago || '00:00:00'}`).getTime();
      
      if (this.orden === 'LLEGADA_DESC') {
        return dateB - dateA; // Orden descendente: mas recientes arriba
      } else {
        return dateA - dateB; // Orden ascendente: mas antiguos arriba
      }
    });

    this.pagosFiltrados = temp;
  }

  // --- FLUJO: PROCESAR PAGO (Tus funciones originales intactas) ---
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
        this.mostrarMensajeGlobal('Pago procesado y comprobante generado con exito.', 'success');
        this.cargarPagos(); // Recarga la tabla con los datos actualizados
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Ocurrio un error al procesar la transaccion.';
        this.cdr.detectChanges();
      }
    });
  }

  // --- FLUJO: VER COMPROBANTE (Tus funciones originales intactas) ---
  openReceiptModal(pago: Pago): void {
    this.pagoSeleccionado = pago;
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal(): void {
    this.isReceiptModalOpen = false;
    this.pagoSeleccionado = undefined;
  }

  imprimirRecibo(): void {
    window.print(); // Solucion rapida nativa del navegador para imprimir el area visible
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