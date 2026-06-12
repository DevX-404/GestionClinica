import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DashboardService, DashboardMetrics } from '../../../shared/services/dashboard.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ecommerce', // Mantenemos el selector para no romper rutas
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ecommerce.component.html',
  providers: [CurrencyPipe]
})
export class EcommerceComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  
  metrics: DashboardMetrics = {
    totalPacientes: 0, totalMedicos: 0, citasHoy: 0, citasPendientesHoy: 0, ingresosHoy: 0
  };
  isLoading: boolean = true;
  rolActual: string = '';

  ngOnInit(): void {
    this.rolActual = localStorage.getItem('rol')?.toUpperCase() || 'ADMINISTRADOR';
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.dashboardService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metrics = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando el dashboard', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}