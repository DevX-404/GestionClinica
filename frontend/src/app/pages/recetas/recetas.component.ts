import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecetaMedicaService } from '../../shared/services/receta-medica.service';

export interface PacienteAgrupado {
  nombrePaciente: string;
  dniPaciente: string; // <--- NUEVO
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
  
  pacientesAgrupados: PacienteAgrupado[] = [];
  pacientesFiltrados: PacienteAgrupado[] = [];
  searchTerm: string = '';
  
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
        },
        error: (err) => {
          console.error('Error al cargar la BD, usando datos de prueba', err);
          this.usarDatosDePrueba();
          this.isLoading = false;
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
          dniPaciente: r.dniPaciente || 'Sin DNI', // <--- NUEVO
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
    const term = this.searchTerm.toLowerCase();
    this.pacientesFiltrados = this.pacientesAgrupados.filter(p => 
      p.nombrePaciente.toLowerCase().includes(term) ||
      p.ultimaEmision.includes(term) ||
      p.dniPaciente.includes(term) // <--- MAGIA PARA BUSCAR POR DNI
    );
  }

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