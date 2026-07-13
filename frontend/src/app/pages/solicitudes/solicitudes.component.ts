import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../shared/services/solicitud.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.component.html'
})
export class SolicitudesComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // DATOS
  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];
  solicitudesPaginadas: any[] = [];
  
  // TABLA Y FILTROS
  searchTerm: string = '';
  filtroEstado: string = 'PENDIENTE'; 
  itemsPorPagina: number = 10;
  paginaActual: number = 1;
  isLoading: boolean = false;

  // ALERTAS
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // MODAL DE RECHAZO
  isRejectModalOpen: boolean = false;
  ticketSeleccionado: any = null;
  motivoRechazo: string = '';

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.solicitudService.listarTodas().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.filtrar();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la bandeja de tickets.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.solicitudesFiltradas = this.solicitudes.filter(s => {
      const matchSearch = term === '' || 
                          (s.nombreUsuario && s.nombreUsuario.toLowerCase().includes(term)) ||
                          (s.tipo && s.tipo.toLowerCase().includes(term));
      const matchEstado = this.filtroEstado === 'TODOS' || s.estado === this.filtroEstado;
      return matchSearch && matchEstado;
    });

    this.paginaActual = 1;
    this.actualizarTabla();
  }

  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.solicitudesPaginadas = this.solicitudesFiltradas.slice(inicio, fin);
  }

  cambiarPaginacion(): void { this.paginaActual = 1; this.actualizarTabla(); }
  paginaAnterior(): void { if (this.paginaActual > 1) { this.paginaActual--; this.actualizarTabla(); } }
  paginaSiguiente(): void { if ((this.paginaActual * this.itemsPorPagina) < this.solicitudesFiltradas.length) { this.paginaActual++; this.actualizarTabla(); } }
  calcularRangoInicio(): number { return this.solicitudesFiltradas.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1; }
  calcularRangoFin(): number { const fin = this.paginaActual * this.itemsPorPagina; return fin > this.solicitudesFiltradas.length ? this.solicitudesFiltradas.length : fin; }

  // APROBAR Y REDIRIGIR AL MÓDULO DE MÉDICOS
  aprobarYRedirigir(ticket: any): void {
    if(confirm(`¿Deseas marcar este ticket de ${ticket.nombreUsuario} como APROBADO y proceder a aplicar los cambios en el sistema?`)) {
      this.solicitudService.responder(ticket.idSolicitud, 'APROBADA', 'Solicitud aprobada. Cambios aplicados en sistema.').subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Ticket cerrado con éxito. Redirigiendo...', 'success');
          // Redirección con un pequeño retraso para que vea el mensaje
          setTimeout(() => {
            this.router.navigate(['/medicos']);
          }, 1500);
        },
        error: () => this.mostrarMensajeGlobal('No se pudo aprobar el ticket.', 'error')
      });
    }
  }

  // RECHAZAR CON MOTIVO
  abrirRechazo(ticket: any): void {
    this.ticketSeleccionado = ticket;
    this.motivoRechazo = '';
    this.isRejectModalOpen = true;
  }

  cerrarRechazo(): void {
    this.isRejectModalOpen = false;
    this.ticketSeleccionado = null;
  }

  confirmarRechazo(): void {
    if (!this.motivoRechazo.trim()) {
      this.mostrarMensajeGlobal('Debes escribir un motivo de rechazo.', 'error');
      return;
    }
    
    this.solicitudService.responder(this.ticketSeleccionado.idSolicitud, 'RECHAZADA', this.motivoRechazo).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('Ticket rechazado y notificado al empleado.', 'success');
        this.cerrarRechazo();
        this.cargarSolicitudes();
      },
      error: () => this.mostrarMensajeGlobal('Error al rechazar el ticket.', 'error')
    });
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