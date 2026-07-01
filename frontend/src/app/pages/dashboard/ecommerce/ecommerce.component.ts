import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DashboardService, DashboardMetrics } from '../../../shared/services/dashboard.service';
import { CitaMedicaService } from '../../../shared/services/cita-medica.service';
import { PagoService } from '../../../shared/services/pago.service';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ecommerce', // Mantenemos el selector para no romper rutas
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule],
  templateUrl: './ecommerce.component.html',
  providers: [CurrencyPipe]
})
export class EcommerceComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private citaService = inject(CitaMedicaService);
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);
  
  metrics: DashboardMetrics = {
    totalPacientes: 0, totalMedicos: 0, citasHoy: 0, citasPendientesHoy: 0, ingresosHoy: 0
  };
  
  // Métricas extra calculadas en frontend
  citasAtendidasHoyMedico: number = 0;
  citasPendientesMedico: number = 0;
  totalCajaHoy: number = 0;

  isLoading: boolean = true;
  rolActual: string = '';
  usernameActual: string = '';

  // Configuración de Gráficos
  chartEspecialidades: any;
  chartMetodosPago: any;
  chartEficaciaMedico: any;

  ngOnInit(): void {
    this.rolActual = localStorage.getItem('rol')?.toUpperCase() || 'ADMINISTRADOR';
    this.usernameActual = localStorage.getItem('username')?.toLowerCase() || '';
    this.cargarDatosReales();
  }

  cargarDatosReales(): void {
    // Usamos forkJoin para traer toda la data real al mismo tiempo
    forkJoin({
      metricas: this.dashboardService.obtenerMetricas(),
      citas: this.citaService.listarTodas(),
      pagos: this.pagoService.listarTodos()
    }).subscribe({
      next: (res) => {
        this.metrics = res.metricas;
        const hoy = new Date().toISOString().split('T')[0];

        // ==========================================
        // LÓGICA PARA ADMINISTRADOR
        // ==========================================
        if (this.rolActual === 'ADMINISTRADOR') {
          // Gráfico: Demanda por Especialidad (Histórico)
          const conteoEspecialidades: { [key: string]: number } = {};
          res.citas.forEach((c: any) => {
            const esp = c.nombreEspecialidad || 'General';
            conteoEspecialidades[esp] = (conteoEspecialidades[esp] || 0) + 1;
          });
          
          this.chartEspecialidades = {
            series: Object.values(conteoEspecialidades).length ? Object.values(conteoEspecialidades) : [1],
            chart: { type: "donut", height: 320, fontFamily: 'inherit' },
            labels: Object.keys(conteoEspecialidades).length ? Object.keys(conteoEspecialidades) : ['Sin datos'],
            colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
            plotOptions: { pie: { donut: { size: '70%' } } },
            dataLabels: { enabled: false },
            legend: { position: "bottom" }
          };
        }

        // ==========================================
        // LÓGICA PARA MÉDICO
        // ==========================================
        if (this.rolActual === 'MEDICO') {
          // Filtramos solo las citas de ESTE médico para HOY
          const misCitasHoy = res.citas.filter((c: any) => 
            c.fecha === hoy && c.usernameMedico?.toLowerCase() === this.usernameActual
          );

          this.citasAtendidasHoyMedico = misCitasHoy.filter((c: any) => c.estado === 'ATENDIDA').length;
          this.citasPendientesMedico = misCitasHoy.filter((c: any) => c.estado === 'EN_ESPERA' || c.estado === 'CONFIRMADA').length;
          const canceladas = misCitasHoy.filter((c: any) => c.estado === 'CANCELADA').length;

          // Gráfico: Eficacia Diaria
          this.chartEficaciaMedico = {
            series: [{ name: "Pacientes", data: [this.citasAtendidasHoyMedico, this.citasPendientesMedico, canceladas] }],
            chart: { type: "bar", height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
            colors: ["#10b981", "#f59e0b", "#ef4444"],
            plotOptions: { bar: { borderRadius: 4, distributed: true, columnWidth: '50%' } },
            dataLabels: { enabled: true, style: { colors: ['#fff'] } },
            xaxis: { categories: ["Atendidas", "Pendientes", "Canceladas"] },
            legend: { show: false }
          };
        }

        // ==========================================
        // LÓGICA PARA RECEPCIONISTA
        // ==========================================
        if (this.rolActual === 'RECEPCIONISTA') {
          // Filtrar ingresos solo de HOY que estén PAGADOS
          const pagosHoy = res.pagos.filter((p: any) => 
            p.fechaPago === hoy && (p.estadoPago === 'PAGADO' || p.estadoPago === 'COMPLETADO')
          );
          
          this.totalCajaHoy = pagosHoy.reduce((sum, p) => sum + Number(p.monto), 0);

          // Gráfico: Métodos de Pago Preferidos
          const conteoMetodos: { [key: string]: number } = { 'EFECTIVO': 0, 'YAPE': 0, 'PLIN': 0, 'TARJETA': 0 };
          pagosHoy.forEach((p: any) => {
            const metodo = p.metodoPago || 'EFECTIVO';
            if (conteoMetodos[metodo] !== undefined) conteoMetodos[metodo] += Number(p.monto);
          });

          this.chartMetodosPago = {
            series: Object.values(conteoMetodos).every(v => v === 0) ? [1] : Object.values(conteoMetodos),
            chart: { type: "pie", height: 320, fontFamily: 'inherit' },
            labels: Object.values(conteoMetodos).every(v => v === 0) ? ['Sin Ingresos'] : Object.keys(conteoMetodos),
            colors: ["#10b981", "#8b5cf6", "#ec4899", "#3b82f6"],
            dataLabels: { enabled: true, formatter: (val: any, opts: any) => `S/ ${opts.w.globals.seriesTotals[opts.seriesIndex]}` },
            legend: { position: "bottom" }
          };
        }

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