import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Atencion {
  idAtencion: string;
  fecha: string;
  medico: string;
  especialidad: string;
  motivo: string;
  sintomas: string;
  diagnosticos: string;
  tratamiento: string;
}

export interface ExpedienteClinico {
  dni: string;
  nombres: string;
  numeroExpediente: string;
  ultimaAtencion: string;
  atenciones: Atencion[];
}

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historia-clinica.component.html'
})
export class HistoriaClinicaComponent implements OnInit {
  
  expedientes: ExpedienteClinico[] = [];
  expedientesFiltrados: ExpedienteClinico[] = [];
  searchTerm: string = '';
  
  isLoading = false;
  isModalOpen = false;
  expedienteSeleccionado: ExpedienteClinico | null = null;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    
    // Aquí luego conectaremos tu Backend. Por ahora usamos estos datos 
    // para que le muestres a tu enamorado cómo se ven los códigos.
    const mockData: ExpedienteClinico[] = [
      {
        dni: '74635241',
        nombres: 'Ximena Burga Pérez',
        numeroExpediente: 'EXP-74635241',
        ultimaAtencion: '2026-06-15',
        atenciones: [
          {
            idAtencion: 'AT-0045',
            fecha: '2026-06-15',
            medico: 'Dr. Roberto Mendoza',
            especialidad: 'Medicina General',
            motivo: 'Dolor de cabeza intenso y fiebre',
            sintomas: 'Temperatura de 39°C, escalofríos, mareos leves.',
            diagnosticos: 'Faringitis Aguda',
            tratamiento: 'Amoxicilina 500mg cada 8 horas, reposo absoluto.'
          },
          {
            idAtencion: 'AT-0012',
            fecha: '2026-01-10',
            medico: 'Dra. Carla Ruiz',
            especialidad: 'Cardiología',
            motivo: 'Chequeo de rutina',
            sintomas: 'Ninguno, paciente asintomático.',
            diagnosticos: 'Paciente Sano, presión arterial estable.',
            tratamiento: 'Mantener dieta balanceada y ejercicio regular.'
          }
        ]
      },
      {
        dni: '45678912',
        nombres: 'Luis Bances',
        numeroExpediente: 'EXP-45678912',
        ultimaAtencion: '2026-05-20',
        atenciones: [
          {
            idAtencion: 'AT-0033',
            fecha: '2026-05-20',
            medico: 'Dr. Roberto Mendoza',
            especialidad: 'Medicina General',
            motivo: 'Dolor estomacal',
            sintomas: 'Náuseas, pesadez después de comer.',
            diagnosticos: 'Gastritis Leve',
            tratamiento: 'Omeprazol 20mg en ayunas por 14 días.'
          }
        ]
      }
    ];

    setTimeout(() => {
      this.expedientes = mockData;
      this.expedientesFiltrados = mockData;
      this.isLoading = false;
    }, 800); // Simulamos que está cargando del servidor
  }

  buscar() {
    const term = this.searchTerm.toLowerCase();
    this.expedientesFiltrados = this.expedientes.filter(e => 
      e.nombres.toLowerCase().includes(term) ||
      e.dni.includes(term) ||
      e.numeroExpediente.toLowerCase().includes(term)
    );
  }

  verHistorial(exp: ExpedienteClinico) {
    this.expedienteSeleccionado = exp;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.expedienteSeleccionado = null;
  }

  imprimirHistoria() {
    alert('¡Botón configurado! Listo para generar el PDF de la Historia Clínica completa.');
  }
}