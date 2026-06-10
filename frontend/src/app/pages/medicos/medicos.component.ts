import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicoService } from '../../shared/services/medico.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { HorarioMedicoService } from '../../shared/services/horario-medico.service';
import { Medico } from '../../shared/models/medico.model';
import { Especialidad } from '../../shared/models/especialidad.model';
import { HorarioMedico } from '../../shared/models/horario-medico.model';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicos.component.html'
})
export class MedicosComponent implements OnInit {
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);
  private horarioService = inject(HorarioMedicoService);

  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  especialidades: Especialidad[] = [];
  horarios: HorarioMedico[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;
  isLoadingHorarios: boolean = false;
  
  // Alertas Globales
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Modal Médico
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  errorMsg: string = '';
  medicoForm: Medico = this.resetForm();

  // Modal Horarios
  isScheduleModalOpen: boolean = false;
  medicoSeleccionado?: Medico;
  errorScheduleMsg: string = '';
  
  // Formulario interno de horario
  horarioForm = {
    diaSemana: 'LUNES',
    horaInicio: '',
    horaFin: ''
  };

  diasSemana: string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

  ngOnInit(): void {
    this.cargarEspecialidades();
    this.cargarMedicos();
  }

  cargarEspecialidades(): void {
    this.especialidadService.listarTodas().subscribe({
      next: (data) => this.especialidades = data,
      error: (err) => console.error('Error al cargar especialidades', err)
    });
  }

  cargarMedicos(): void {
    this.isLoading = true;
    this.medicoService.listarTodos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.medicosFiltrados = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la lista de médicos.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.medicosFiltrados = this.medicos.filter(m => 
      m.nombres.toLowerCase().includes(term) ||
      m.apellidoPaterno.toLowerCase().includes(term) ||
      m.codigoColegiatura.toLowerCase().includes(term)
    );
  }

  // Métodos del Modal de Médico
  openModal(medico?: Medico): void {
    this.errorMsg = '';
    if (medico) {
      this.isEditing = true;
      this.medicoForm = { ...medico };
    } else {
      this.isEditing = false;
      this.medicoForm = this.resetForm();
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  guardarMedico(): void {
    if (!this.medicoForm.nombres || !this.medicoForm.codigoColegiatura || !this.medicoForm.correo || !this.medicoForm.idEspecialidad) {
      this.errorMsg = 'Por favor, completa los campos obligatorios.';
      return;
    }

    if (this.isEditing && this.medicoForm.idMedico) {
      this.medicoService.actualizar(this.medicoForm.idMedico, this.medicoForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico actualizado con éxito.', 'success');
          this.cargarMedicos();
        },
        error: (err) => this.errorMsg = err.error?.message || 'Error al actualizar.'
      });
    } else {
      this.medicoService.registrar(this.medicoForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico registrado y cuenta creada con su correo.', 'success');
          this.cargarMedicos();
        },
        error: (err) => this.errorMsg = err.error?.message || 'El correo o colegiatura ya existe.'
      });
    }
  }

  eliminarMedico(id: number): void {
    if (confirm('¿Estás seguro de dar de baja a este médico?')) {
      this.medicoService.eliminar(id).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Médico deshabilitado del sistema.', 'success');
          this.cargarMedicos();
        },
        error: () => this.mostrarMensajeGlobal('No se pudo procesar la baja del médico.', 'error')
      });
    }
  }

  // Métodos del Modal de Horarios específicos
  openScheduleModal(medico: Medico): void {
    this.medicoSeleccionado = medico;
    this.errorScheduleMsg = '';
    this.horarioForm = { diaSemana: 'LUNES', horaInicio: '', horaFin: '' };
    this.cargarHorariosDelMedico(medico.idMedico!);
    this.isScheduleModalOpen = true;
  }

  closeScheduleModal(): void {
    this.isScheduleModalOpen = false;
  }

  cargarHorariosDelMedico(idMedico: number): void {
    this.isLoadingHorarios = true;
    this.horarioService.listarPorMedico(idMedico).subscribe({
      next: (data) => {
        this.horarios = data;
        this.isLoadingHorarios = false;
      },
      error: () => {
        this.isLoadingHorarios = false;
        this.errorScheduleMsg = 'No se pudieron recuperar los horarios del servidor.';
      }
    });
  }

  agregarHorario(): void {
    if (!this.horarioForm.horaInicio || !this.horarioForm.horaFin) {
      this.errorScheduleMsg = 'Define las horas de inicio y fin del turno.';
      return;
    }
    this.errorScheduleMsg = '';

    // Enviar DTO mapeado al Backend (formato HH:mm:ss que requiere LocalTime)
    const nuevoHorario: HorarioMedico = {
      idMedico: this.medicoSeleccionado!.idMedico!,
      diaSemana: this.horarioForm.diaSemana,
      horaInicio: this.horarioForm.horaInicio + ':00',
      horaFin: this.horarioForm.horaFin + ':00'
    };

    this.horarioService.registrar(nuevoHorario).subscribe({
      next: () => {
        this.horarioForm.horaInicio = '';
        this.horarioForm.horaFin = '';
        this.cargarHorariosDelMedico(this.medicoSeleccionado!.idMedico!);
      },
      error: (err) => {
        this.errorScheduleMsg = err.error?.message || 'Error: El médico ya tiene horario este día o las horas son inválidas.';
      }
    });
  }

  eliminarHorario(idHorario: number): void {
    this.horarioService.eliminar(idHorario).subscribe({
      next: () => this.cargarHorariosDelMedico(this.medicoSeleccionado!.idMedico!),
      error: () => this.errorScheduleMsg = 'No se pudo eliminar el horario.'
    });
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000);
  }

  private resetForm(): Medico {
    return {
      codigoColegiatura: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
      telefono: '', correo: '', estadoDisponibilidad: 'DISPONIBLE', idEspecialidad: 0
    };
  }
}