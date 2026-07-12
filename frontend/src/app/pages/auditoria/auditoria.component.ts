import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../shared/services/auditoria.service';
import { Auditoria } from '../../shared/models/auditoria.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  providers: [DatePipe]
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private cdr = inject(ChangeDetectorRef);

  // DATOS
  logs: Auditoria[] = [];
  logsFiltrados: Auditoria[] = [];
  logsPaginados: Auditoria[] = []; // NUEVO: Para la paginación de la tabla
  
  // CONTROLES DE TABLA Y BÚSQUEDA
  searchTerm: string = '';
  itemsPorPagina: number = 10; // Por defecto mostramos 10 para los logs
  paginaActual: number = 1;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.auditoriaService.listarLogs().subscribe({
      next: (data) => {
        // Ordenamos los logs del más reciente al más antiguo
        const logsOrdenados = data.sort((a: any, b: any) => {
          return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();
        });

        this.logs = logsOrdenados;
        this.filtrar(); // Inicializa el filtrado y la paginación
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- FILTRADO CON PAGINACIÓN ---
  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.logsFiltrados = [...this.logs];
    } else {
      this.logsFiltrados = this.logs.filter(log => 
        log.username.toLowerCase().includes(term) ||
        log.entidad.toLowerCase().includes(term) ||
        log.accion.toLowerCase().includes(term)
      );
    }
    
    // Regresamos a la primera página tras buscar y actualizamos la tabla
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.logsPaginados = this.logsFiltrados.slice(inicio, fin);
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
    if ((this.paginaActual * this.itemsPorPagina) < this.logsFiltrados.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.logsFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.logsFiltrados.length ? this.logsFiltrados.length : fin;
  }
  // --- FIN LÓGICA PAGINACIÓN ---

  getColorAccion(accion: string): string {
    if (accion.includes('CREACIÓN') || accion.includes('CREACION') || accion.includes('POST')) return 'bg-green-50 text-green-700 border-green-200';
    if (accion.includes('ELIMINACIÓN') || accion.includes('ELIMINACION') || accion.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-blue-50 text-blue-700 border-blue-200'; // ACTUALIZACIÓN
  }

  exportarExcel(): void {
    // Función vacía dejada a propósito para ser implementada después
    alert('Función de exportar a Excel en construcción...');
  }
}