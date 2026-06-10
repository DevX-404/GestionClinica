import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { PacienteService } from '../../shared/services/paciente.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { MedicoService } from '../../shared/services/medico.service';

import { CitaMedica } from '../../shared/models/cita-medica.model';
import { Paciente } from '../../shared/models/paciente.model';
import { Especialidad } from '../../shared/models/especialidad.model';
import { Medico } from '../../shared/models/medico.model';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html'
})
export class CitasComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private pacienteService = inject(PacienteService);
  private especialidadService = inject(EspecialidadService);
  private medicoService = inject(MedicoService);

  citas: CitaMedica[] = [];
  citasFiltradas: CitaMedica[] = [];
  
  // Catálogos para el modal
  pacientes: Paciente[] = [];
  especialidades: Especialidad[] = [];
  medicos: Medico[] = [];
  medicosFiltradosPorEspecialidad: Medico[] = [];

  searchTerm: string = '';
  isLoading: boolean = false;
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Control del Modal
  isModalOpen: boolean = false;
  errorMsg: string = '';

  // Formulario de Nueva Cita
  citaForm: Partial<CitaMedica> = this.resetForm();

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarCatalogos();
  }

  cargarCitas(): void {
    this.isLoading = true;
    this.citaService.listarTodas().subscribe({
      next: (data) => {
        this.citas = data;
        this.citasFiltradas = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar el registro de citas.', 'error');
      }
    });
  }

  cargarCatalogos(): void {
    this.pacienteService.listarTodos().subscribe(data => this.pacientes = data);
    this.especialidadService.listarTodas().subscribe(data => this.especialidades = data);
    this.medicoService.listarTodos().subscribe(data => this.medicos = data);
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.citasFiltradas = this.citas.filter(c => 
      c.nombreCompletoPaciente?.toLowerCase().includes(term) ||
      c.nombreCompletoMedico?.toLowerCase().includes(term) ||
      c.nombreEspecialidad?.toLowerCase().includes(term)
    );
  }

  onEspecialidadChange(): void {
    // Cuando el usuario elige una especialidad, filtramos los médicos de esa rama
    this.medicosFiltradosPorEspecialidad = this.medicos.filter(
      m => m.idEspecialidad === this.citaForm.idEspecialidad
    );
    this.citaForm.idMedico = 0; // Reiniciar médico
  }

  openModal(): void {
    this.errorMsg = '';
    this.citaForm = this.resetForm();
    this.medicosFiltradosPorEspecialidad = [];
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  guardarCita(): void {
    if (!this.citaForm.idPaciente || !this.citaForm.idEspecialidad || !this.citaForm.idMedico || !this.citaForm.fecha || !this.citaForm.hora) {
      this.errorMsg = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    // Aseguramos que la hora envíe los segundos (HH:mm:ss) para que Spring Boot la acepte (LocalTime)
    if (this.citaForm.hora.length === 5) {
      this.citaForm.hora = `${this.citaForm.hora}:00`;
    }

    this.citaService.programarCita(this.citaForm as CitaMedica).subscribe({
      next: () => {
        this.closeModal();
        this.mostrarMensajeGlobal('Cita programada con éxito.', 'success');
        this.cargarCitas();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error: El médico no está disponible o hubo un problema en el registro.';
      }
    });
  }

  cambiarEstado(idCita: number, nuevoEstado: string): void {
    if (confirm(`¿Estás seguro de marcar esta cita como ${nuevoEstado}?`)) {
      this.citaService.actualizarEstado(idCita, nuevoEstado).subscribe({
        next: () => {
          this.mostrarMensajeGlobal(`Estado de la cita actualizado a ${nuevoEstado}.`, 'success');
          this.cargarCitas();
        },
        error: () => this.mostrarMensajeGlobal('No se pudo actualizar el estado.', 'error')
      });
    }
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000);
  }

  private resetForm(): Partial<CitaMedica> {
    return {
      idPaciente: 0,
      idEspecialidad: 0,
      idMedico: 0,
      fecha: '',
      hora: '',
      motivoConsulta: ''
    };
  }
}