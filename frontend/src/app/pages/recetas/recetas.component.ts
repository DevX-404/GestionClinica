import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecetaMedicaService } from '../../shared/services/receta-medica.service';

export interface PacienteAgrupado {
  nombrePaciente: string;
  dniPaciente: string; 
  ultimaEmision: string;
  totalRecetas: number;
  recetas: any[];
}

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recetas.component.html'
})
export class RecetasComponent implements OnInit {
  private recetaService = inject(RecetaMedicaService);
  private cdr = inject(ChangeDetectorRef);
  
  pacientesAgrupados: PacienteAgrupado[] = [];
  pacientesFiltrados: PacienteAgrupado[] = [];
  pacientesPaginados: PacienteAgrupado[] = []; // NUEVO: Para la paginación de la tabla
  
  // Controles de Paginación y Búsqueda
  searchTerm: string = '';
  itemsPorPagina: number = 5;
  paginaActual: number = 1;
  
  isLoading = false;
  isModalOpen = false;
  pacienteSeleccionado: PacienteAgrupado | null = null;

  ngOnInit() {
    this.cargarExpedientes();
  }

  cargarExpedientes() {
    this.isLoading = true;
    
    if (this.recetaService['listarTodas']) {
      this.recetaService.listarTodas().subscribe({
        next: (data: any[]) => {
          if (data && data.length > 0) {
            this.agruparPorPaciente(data);
          } else {
            this.usarDatosDePrueba();
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar la BD, usando datos de prueba', err);
          this.usarDatosDePrueba();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.usarDatosDePrueba();
    }
  }

  agruparPorPaciente(recetas: any[]) {
    const grupos: { [key: string]: PacienteAgrupado } = {};

    recetas.sort((a, b) => {
      const fechaA = a.fechaEmision ? new Date(a.fechaEmision).getTime() : 0;
      const fechaB = b.fechaEmision ? new Date(b.fechaEmision).getTime() : 0;
      return fechaB - fechaA; 
    });

    recetas.forEach(r => {
      const nombre = r.nombrePaciente || 'Paciente Desconocido';
      if (!grupos[nombre]) {
        grupos[nombre] = {
          nombrePaciente: nombre,
          dniPaciente: r.dniPaciente || 'Sin DNI', 
          ultimaEmision: r.fechaEmision,
          totalRecetas: 0,
          recetas: []
        };
      }
      grupos[nombre].recetas.push(r);
      grupos[nombre].totalRecetas++;
    });

    this.pacientesAgrupados = Object.values(grupos);
    this.pacientesFiltrados = [...this.pacientesAgrupados];
    
    // Iniciar la tabla
    this.actualizarTabla();
  }

  usarDatosDePrueba() {
    const mockRecetas = [
      {
        idReceta: 101,
        nombrePaciente: 'Ana García',
        dniPaciente: '74635241',
        nombreMedico: 'Dr. Roberto Mendoza',
        fechaEmision: '2026-06-15',
        observaciones: 'Tomar con abundante agua.',
        detalles: [{ medicamento: 'Amoxicilina', dosis: '500mg', frecuencia: 'Cada 8 hrs', duracion: '7 días' }]
      }
    ];
    this.agruparPorPaciente(mockRecetas);
    this.isLoading = false;
  }

  buscar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.pacientesFiltrados = [...this.pacientesAgrupados];
    } else {
      this.pacientesFiltrados = this.pacientesAgrupados.filter(p => 
        p.nombrePaciente.toLowerCase().includes(term) ||
        p.ultimaEmision.includes(term) ||
        p.dniPaciente.includes(term) 
      );
    }
    
    // Regresamos a la primera página tras buscar y actualizamos tabla
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.pacientesPaginados = this.pacientesFiltrados.slice(inicio, fin);
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
    if ((this.paginaActual * this.itemsPorPagina) < this.pacientesFiltrados.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.pacientesFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.pacientesFiltrados.length ? this.pacientesFiltrados.length : fin;
  }
  // --- FIN LÓGICA DE PAGINACIÓN ---

  verExpediente(paciente: PacienteAgrupado) {
    this.pacienteSeleccionado = paciente;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.pacienteSeleccionado = null;
  }

  exportarPDF(idReceta: number) {
    alert('¡Botón configurado! Exportando PDF físico para la Receta N° ' + idReceta);
  }
}