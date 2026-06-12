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

  logs: Auditoria[] = [];
  logsFiltrados: Auditoria[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.auditoriaService.listarLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.logsFiltrados = data;
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
    const term = this.searchTerm.toLowerCase();
    this.logsFiltrados = this.logs.filter(log => 
      log.username.toLowerCase().includes(term) ||
      log.entidad.toLowerCase().includes(term) ||
      log.accion.toLowerCase().includes(term)
    );
  }

  getColorAccion(accion: string): string {
    if (accion.includes('CREACIÓN')) return 'bg-green-100 text-green-800 border-green-200';
    if (accion.includes('ELIMINACIÓN')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200'; // ACTUALIZACIÓN
  }
}