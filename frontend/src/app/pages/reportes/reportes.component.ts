import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  rangoFechas: string = 'MES_ACTUAL';

  // Variables para renderizar los gráficos de ApexCharts
  chartIngresos: any;
  chartEspecialidades: any;
  chartCitas: any;

  ngOnInit(): void {
    this.cargarGraficosMuestra();
  }

  cargarGraficosMuestra() {
    // 1. Gráfico de Ingresos (Evolución Área)
    this.chartIngresos = {
      series: [{ name: "Ingresos Brutos (S/)", data: [1500, 2300, 1800, 3200, 2800, 4100, 3900] }],
      chart: { type: "area", height: 350, toolbar: { show: false }, fontFamily: 'inherit' },
      colors: ["#3b82f6"],
      fill: { 
        type: "gradient", 
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } 
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: { categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] },
      yaxis: { labels: { formatter: (value: number) => "S/ " + value } }
    };

    // 2. Gráfico de Citas por Especialidad (Donut)
    this.chartEspecialidades = {
      series: [45, 25, 20, 10],
      chart: { type: "donut", height: 320, fontFamily: 'inherit' },
      labels: ["Medicina General", "Cardiología", "Pediatría", "Traumatología"],
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
      plotOptions: { pie: { donut: { size: '70%' } } },
      dataLabels: { enabled: false },
      legend: { position: "bottom" }
    };

    // 3. Gráfico de Estados de Citas (Barras)
    this.chartCitas = {
      series: [{ name: "Cantidad de Citas", data: [120, 30, 15] }],
      chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      colors: ["#10b981", "#ef4444", "#facc15"],
      plotOptions: { 
        bar: { borderRadius: 6, distributed: true, columnWidth: '45%' } 
      },
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: { categories: ["Atendidas", "Canceladas", "Pendientes"] },
      legend: { show: false },
      tooltip: { theme: 'light' }
    };
  }

  aplicarFiltro() {
    console.log('Solicitando recálculo al servidor por:', this.rangoFechas);
    // Aquí conectaremos con el Backend (Spring Boot) en el futuro
  }

  exportarPDF() {
    alert('Preparando motor PDF para reporte corporativo...');
  }

  exportarExcel() {
    alert('Compilando filas para exportación a Excel...');
  }
}