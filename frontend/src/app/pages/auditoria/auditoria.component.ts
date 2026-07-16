import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../shared/services/auditoria.service';
import { Auditoria } from '../../shared/models/auditoria.model';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  logsPaginados: Auditoria[] = [];
  
  // CONTROLES DE TABLA Y BÚSQUEDA
  searchTerm: string = '';
  itemsPorPagina: number = 10;
  paginaActual: number = 1;
  isLoading: boolean = false;

  // Variables de alerta global
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.auditoriaService.listarLogs().subscribe({
      next: (data) => {
        const logsOrdenados = data.sort((a: any, b: any) => {
          return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();
        });

        this.logs = logsOrdenados;
        this.filtrar();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

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
    this.paginaActual = 1;
    this.actualizarTabla();
  }

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

  getColorAccion(accion: string): string {
    if (accion.includes('CREACIÓN') || accion.includes('CREACION') || accion.includes('POST')) return 'bg-green-50 text-green-700 border-green-200';
    if (accion.includes('ELIMINACIÓN') || accion.includes('ELIMINACION') || accion.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
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

  // ==========================================
  // EXPORTAR A EXCEL
  // ==========================================
  exportarExcel(): void {
    // Tomamos la lista de logs filtrados para que se exporte lo que el usuario está viendo
    const exportData = this.logsFiltrados.map(log => ({
      'Fecha y Hora': new Date(log.fechaHora).toLocaleString(),
      'Usuario': log.username,
      'Módulo Afectado': log.entidad,
      'Tipo de Acción': log.accion,
      'Detalle del Sistema': log.detalle
    }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    
    // Ajustar el ancho de las columnas
    ws['!cols'] = [ { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 50 } ];

    XLSX.utils.book_append_sheet(wb, ws, 'Logs de Auditoría');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `CixClinic_Auditoria_${new Date().getTime()}.xlsx`);
  }

  // ==========================================
  // EXPORTAR A PDF
  // ==========================================
  exportarPDF(): void {
    // Usamos 'landscape' (horizontal) porque la columna "Detalle" suele ser muy ancha
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text('Registro de Auditoría de Seguridad - CixClinic', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(`Total de registros extraídos: ${this.logsFiltrados.length}`, 14, 32);

    const tableBody = this.logsFiltrados.map(log => [
      new Date(log.fechaHora).toLocaleString(),
      log.username,
      log.entidad,
      log.accion,
      log.detalle
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Fecha y Hora', 'Usuario', 'Módulo Afectado', 'Tipo de Acción', 'Detalle del Sistema']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }, // Color esmeralda oscuro
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { cellWidth: 'auto' } // Deja que el detalle ocupe el espacio restante y haga saltos de línea
      }
    });

    doc.save(`CixClinic_Auditoria_${new Date().getTime()}.pdf`);
  }
}