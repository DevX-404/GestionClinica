import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService } from '../../shared/services/incidencia.service';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.component.html'
})
export class IncidenciasComponent implements OnInit {
  private incidenciaService = inject(IncidenciaService);
  private cdr = inject(ChangeDetectorRef);

  incidencias: any[] = [];
  incidenciasFiltradas: any[] = [];
  incidenciasPaginadas: any[] = [];
  
  searchTerm: string = '';
  filtroEstado: string = 'ABIERTO'; 
  itemsPorPagina: number = 10;
  paginaActual: number = 1;
  isLoading: boolean = false;

  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // MODAL DE GESTIÓN DE TICKET
  isTicketModalOpen: boolean = false;
  ticketSeleccionado: any = null;
  evidenciasArray: string[] = [];
  respuestaAdmin: string = '';
  nuevoEstado: string = '';

  ngOnInit(): void {
    this.cargarIncidencias();
  }

  cargarIncidencias(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.incidenciaService.listarTodas().subscribe({
      next: (data) => {
        this.incidencias = data;
        this.filtrar();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar el panel de TI.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.incidenciasFiltradas = this.incidencias.filter(i => {
      const matchSearch = term === '' || 
                          (i.nombreUsuarioReporta && i.nombreUsuarioReporta.toLowerCase().includes(term)) ||
                          (i.titulo && i.titulo.toLowerCase().includes(term)) ||
                          (i.tipo && i.tipo.toLowerCase().includes(term));
      
      const matchEstado = this.filtroEstado === 'TODOS' || i.estado === this.filtroEstado;
      return matchSearch && matchEstado;
    });

    this.paginaActual = 1;
    this.actualizarTabla();
  }

  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.incidenciasPaginadas = this.incidenciasFiltradas.slice(inicio, fin);
  }

  cambiarPaginacion(): void { this.paginaActual = 1; this.actualizarTabla(); }
  paginaAnterior(): void { if (this.paginaActual > 1) { this.paginaActual--; this.actualizarTabla(); } }
  paginaSiguiente(): void { if ((this.paginaActual * this.itemsPorPagina) < this.incidenciasFiltradas.length) { this.paginaActual++; this.actualizarTabla(); } }
  calcularRangoInicio(): number { return this.incidenciasFiltradas.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1; }
  calcularRangoFin(): number { const fin = this.paginaActual * this.itemsPorPagina; return fin > this.incidenciasFiltradas.length ? this.incidenciasFiltradas.length : fin; }

  // GESTIÓN DEL TICKET
  abrirTicket(ticket: any): void {
    this.ticketSeleccionado = ticket;
    this.respuestaAdmin = ticket.respuestaAdmin || '';
    this.nuevoEstado = ticket.estado;
    
    // Parsear el JSON de imágenes si existe
    this.evidenciasArray = [];
    if (ticket.evidenciasJson) {
      try {
        this.evidenciasArray = JSON.parse(ticket.evidenciasJson);
      } catch (e) {
        console.error("Error al leer evidencias", e);
      }
    }
    
    this.isTicketModalOpen = true;
  }

  cerrarTicket(): void {
    this.isTicketModalOpen = false;
    this.ticketSeleccionado = null;
  }

  actualizarTicket(): void {
    if (this.nuevoEstado === 'RESUELTO' && !this.respuestaAdmin.trim()) {
      this.mostrarMensajeGlobal('Debes escribir una respuesta o diagnóstico antes de marcarlo como Resuelto.', 'error');
      return;
    }

    this.incidenciaService.responder(this.ticketSeleccionado.idIncidencia, this.nuevoEstado, this.respuestaAdmin).subscribe({
      next: () => {
        this.mostrarMensajeGlobal(`Ticket actualizado a ${this.nuevoEstado} exitosamente.`, 'success');
        this.cerrarTicket();
        this.cargarIncidencias();
      },
      error: () => this.mostrarMensajeGlobal('Error al actualizar el ticket de soporte.', 'error')
    });
  }

  formatearFechaLarga(fechaIso: string): string {
    if (!fechaIso) return '--/--/----';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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