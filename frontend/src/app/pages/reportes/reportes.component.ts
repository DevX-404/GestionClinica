import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';

import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { PagoService } from '../../shared/services/pago.service';

import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  
  private citaService = inject(CitaMedicaService);
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  rangoFechas: string = 'MES_ACTUAL';
  isLoading: boolean = false;

  // Variables de alerta global
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Almacén de datos crudos (Para no golpear la BD cada vez que cambias el filtro)
  pagosBrutos: any[] = [];
  citasBrutas: any[] = [];

  // Métricas Calculadas
  totalIngresos: number = 0;
  totalCitasFiltro: number = 0;
  pacientesFrecuentes: any[] = [];

  // Gráficos
  chartIngresos: any;
  chartEspecialidades: any;
  chartCitas: any;

  ngOnInit(): void {
    this.inicializarGraficosPlantillas();
    this.cargarDatosDelBackend();
  }

  // --- CARGAMOS AMBOS SERVICIOS SIMULTÁNEAMENTE ---
  cargarDatosDelBackend(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    forkJoin({
      pagos: this.pagoService.listarTodos(),
      citas: this.citaService.listarTodas()
    }).subscribe({
      next: (resp) => {
        this.pagosBrutos = resp.pagos || [];
        this.citasBrutas = resp.citas || [];
        
        // Disparamos el cálculo inicial
        this.aplicarFiltro();
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando datos para métricas', err);
        this.isLoading = false;
        this.mostrarMensajeGlobal('Hubo un problema al cargar los datos del servidor.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltro(): void {
    // 1. FILTRAR DATOS SEGÚN LA FECHA SELECCIONADA
    const pagosFiltrados = this.pagosBrutos.filter(p => 
      this.esFechaEnRango(p.fechaPago) && (p.estadoPago === 'PAGADO' || p.estadoPago === 'COMPLETADO')
    );
    const citasFiltradas = this.citasBrutas.filter(c => 
      this.esFechaEnRango(c.fecha)
    );

    // 2. PROCESAR GRÁFICO 1: INGRESOS (Agrupamos sumando el monto por cada fecha)
    const ingresosMap = new Map<string, number>();
    this.totalIngresos = 0;

    pagosFiltrados.forEach(p => {
      const fecha = p.fechaPago; 
      const monto = parseFloat(p.monto) || 0;
      this.totalIngresos += monto;
      ingresosMap.set(fecha, (ingresosMap.get(fecha) || 0) + monto);
    });

    // Ordenar fechas de más antigua a más reciente para el eje X
    const fechasIngresosOrdenadas = Array.from(ingresosMap.keys()).sort();
    const dataIngresos = fechasIngresosOrdenadas.map(f => parseFloat(ingresosMap.get(f)!.toFixed(2)));

    this.chartIngresos = {
      ...this.chartIngresos,
      series: [{ name: "Ingresos Brutos (S/)", data: dataIngresos }],
      xaxis: { categories: fechasIngresosOrdenadas.length > 0 ? fechasIngresosOrdenadas : [] }
    };

    // 3. PROCESAR GRÁFICO 2: ESPECIALIDADES (Donut)
    const espMap = new Map<string, number>();
    citasFiltradas.forEach(c => {
      const esp = c.nombreEspecialidad || 'General';
      espMap.set(esp, (espMap.get(esp) || 0) + 1);
    });

    this.chartEspecialidades = {
      ...this.chartEspecialidades,
      series: Array.from(espMap.values()),
      labels: Array.from(espMap.keys())
    };

    // 4. PROCESAR GRÁFICO 3: ESTADOS DE CITAS (Barras)
    this.totalCitasFiltro = citasFiltradas.length;
    let totalAtendidas = 0;
    let totalCanceladas = 0;
    let totalPendientes = 0;
    
    citasFiltradas.forEach(c => {
      if (c.estado === 'ATENDIDA') totalAtendidas++;
      else if (c.estado === 'CANCELADA') totalCanceladas++;
      else totalPendientes++; // PENDIENTE_PAGO, EN_ESPERA, CONFIRMADA
    });

    this.chartCitas = {
      ...this.chartCitas,
      series: [{ name: "Cantidad de Citas", data: [totalAtendidas, totalCanceladas, totalPendientes] }]
    };

    // 5. PROCESAR TOP PACIENTES FRECUENTES
    const pacMap = new Map<string, any>();
    citasFiltradas.forEach(c => {
      const dni = c.dniPaciente;
      if (!dni) return;
      if (!pacMap.has(dni)) {
        pacMap.set(dni, { nombre: c.nombreCompletoPaciente, dni: dni, totalCitas: 0 });
      }
      pacMap.get(dni).totalCitas++;
    });

    // Ordenar de mayor a menor y tomar los primeros 5
    this.pacientesFrecuentes = Array.from(pacMap.values())
      .sort((a, b) => b.totalCitas - a.totalCitas)
      .slice(0, 5);

    // Refrescar vistas
    this.cdr.detectChanges();
  }

  // --- FUNCIÓN DE CÁLCULO DE RANGOS DE FECHA ---
  private esFechaEnRango(fechaStr: string): boolean {
    if (!fechaStr) return false;
    
    // Si es "HISTORICO" siempre retorna true (pasan todas)
    if (this.rangoFechas === 'HISTORICO') return true;

    // Convertimos la fecha que viene de la BD (Ej: "2024-05-15") a objeto Date
    const fechaEvaluada = new Date(fechaStr + 'T00:00:00');
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    if (this.rangoFechas === 'HOY') {
      return fechaEvaluada.getTime() === hoy.getTime();
    }

    if (this.rangoFechas === 'SEMANA_ACTUAL') {
      const diaSemana = hoy.getDay() || 7; 
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - diaSemana + 1);
      return fechaEvaluada >= lunes && fechaEvaluada <= hoy;
    }

    if (this.rangoFechas === 'MES_ACTUAL') {
      return fechaEvaluada.getMonth() === hoy.getMonth() && fechaEvaluada.getFullYear() === hoy.getFullYear();
    }

    if (this.rangoFechas === 'ANIO_ACTUAL') {
      return fechaEvaluada.getFullYear() === hoy.getFullYear();
    }

    return true;
  }

  // --- CONFIGURACIONES VISUALES BASE DE APEXCHARTS ---
  inicializarGraficosPlantillas() {
    this.chartIngresos = {
      series: [{ name: "Ingresos Brutos (S/)", data: [] }],
      chart: { type: "area", height: 350, toolbar: { show: false }, fontFamily: 'inherit' },
      colors: ["#10b981"], // Verde
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (value: number) => "S/ " + value } }
    };

    this.chartEspecialidades = {
      series: [],
      chart: { type: "donut", height: 320, fontFamily: 'inherit' },
      labels: [],
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"],
      plotOptions: { pie: { donut: { size: '70%' } } },
      dataLabels: { enabled: false },
      legend: { position: "bottom" }
    };

    this.chartCitas = {
      series: [{ name: "Cantidad de Citas", data: [] }],
      chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      colors: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"],
      plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '45%' } },
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: { categories: ["Atendidas", "Canceladas", "En Espera", "Pendientes"] },
      legend: { show: false },
      tooltip: { theme: 'light' }
    };
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
  // EXPORTAR A PDF
  // ==========================================
  exportarPDF() {
    const doc = new jsPDF();

    // 1. Título del Reporte
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // Gris oscuro
    doc.text('Reporte Gerencial - CixClinic', 14, 22);

    // 2. Resumen de Métricas
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // Gris claro
    doc.text(`Rango de Evaluación: ${this.rangoFechas.replace('_', ' ')}`, 14, 32);
    
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74); // Verde para ingresos
    doc.text(`Total Recaudado: S/ ${this.totalIngresos.toFixed(2)}`, 14, 42);
    
    doc.setTextColor(37, 99, 235); // Azul para citas
    doc.text(`Total Citas Registradas: ${this.totalCitasFiltro}`, 14, 50);

    // 3. Título de la tabla
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Top Pacientes Frecuentes', 14, 65);

    // 4. Armar la tabla
    const tableBody = this.pacientesFrecuentes.map(p => [
      p.nombre,
      p.dni,
      p.totalCitas.toString()
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Paciente', 'DNI', 'Atenciones Totales']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] } // Color azul tipo Tailwind
    });

    // 5. Descargar el archivo
    doc.save(`CixClinic_Reporte_${new Date().getTime()}.pdf`);
    this.mostrarMensajeGlobal('PDF exportado correctamente.', 'success');
  }

  exportarExcel() {
    // 1. Crear los datos del resumen
    const resumenData = [
      { Metrica: 'Clínica', Valor: 'CixClinic' },
      { Metrica: 'Filtro Aplicado', Valor: this.rangoFechas },
      { Metrica: 'Total Recaudado (S/)', Valor: this.totalIngresos.toFixed(2) },
      { Metrica: 'Total Citas Registradas', Valor: this.totalCitasFiltro }
    ];

    // 2. Crear los datos de los pacientes
    const pacientesData = this.pacientesFrecuentes.map(p => ({
      'Nombre del Paciente': p.nombre,
      'Documento (DNI)': p.dni,
      'Cantidad de Citas': p.totalCitas
    }));

    // 3. Crear el libro de Excel y las hojas
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const wsResumen: XLSX.WorkSheet = XLSX.utils.json_to_sheet(resumenData);
    const wsPacientes: XLSX.WorkSheet = XLSX.utils.json_to_sheet(pacientesData);

    // 4. Agregar las hojas al archivo
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Gerencial');
    XLSX.utils.book_append_sheet(wb, wsPacientes, 'Pacientes Frecuentes');

    // 5. Descargar el archivo
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `CixClinic_Reporte_${new Date().getTime()}.xlsx`);
    
    this.mostrarMensajeGlobal('Excel exportado correctamente.', 'success');
  }
}