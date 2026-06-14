import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule,FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicoService } from '../../shared/services/medico.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { HorarioMedicoService } from '../../shared/services/horario-medico.service';
import { Medico } from '../../shared/models/medico.model';
import { Especialidad } from '../../shared/models/especialidad.model';
import { HorarioMedico } from '../../shared/models/horario-medico.model';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './medicos.component.html'
  
})
export class MedicosComponent implements OnInit {
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);
  private horarioService = inject(HorarioMedicoService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

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
  
  // FORMULARIO REACTIVO
  medicoForm: FormGroup;
  
  // Variable para guardar el CMP generado o el actual
  cmpActual: string = '';

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
  
  constructor() {
    this.medicoForm = this.fb.group({
      idMedico: [null],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      // Validación: 9 dígitos exactos numéricos
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]], 
      // Correo opcional
      correo: ['', [Validators.email]],
      idEspecialidad: [0, Validators.required],
      estadoDisponibilidad: ['DISPONIBLE']
    });
  }

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
    this.cdr.detectChanges();

    this.medicoService.listarTodos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.medicosFiltrados = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la lista de médicos.', 'error');
        this.cdr.detectChanges();
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

  // --- GENERADOR DE CMP ALEATORIO ---
  generarCMPAleatorio(): string {
    const numeroAleatorio = Math.floor(10000 + Math.random() * 90000); // 5 dígitos
    return `CMP-${numeroAleatorio}`;
  }

  // Métodos del Modal de Médico
  openModal(medico?: Medico): void {
    this.errorMsg = '';
    if (medico) {
      this.isEditing = true;
      this.medicoForm.patchValue(medico);
      this.cmpActual = medico.codigoColegiatura; // Muestra el actual
    } else {
      this.isEditing = false;
      this.medicoForm.reset({
        estadoDisponibilidad: 'DISPONIBLE',
        idEspecialidad: 0
      });
      // Generar CMP automáticamente para nuevos médicos
      this.cmpActual = this.generarCMPAleatorio();
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // Limitar ingreso de teléfono a 9 números y bloquear letras
  validarTelefono(event: any) {
    const input = event.target;
    // Forzamos a que solo queden números
    let valorFiltrado = input.value.replace(/[^0-9]/g, '');
    
    // Si excede 9 caracteres, lo cortamos
    if (valorFiltrado.length > 9) {
        valorFiltrado = valorFiltrado.substring(0, 9);
    }
    
    // Actualizamos el campo visible
    input.value = valorFiltrado;
    
    // Actualizamos el controlador de Angular para que la validación funcione
    this.medicoForm.controls['telefono'].setValue(valorFiltrado);
  }

  guardarMedico(): void {
    if (this.medicoForm.invalid) {
      this.errorMsg = 'Por favor, corrige los errores en el formulario.';
      this.medicoForm.markAllAsTouched();
      return;
    }
    
    let data = this.medicoForm.value;
    // Añadimos el CMP generado al objeto de datos
    data.codigoColegiatura = this.cmpActual;
    
    // Si no enviaron correo, aseguramos enviar un texto único
    if (!data.correo) {
       data.correo = `${this.cmpActual.toLowerCase()}@clinica.com`; 
    }

    if (this.isEditing && data.idMedico) {
      this.medicoService.actualizar(data.idMedico, data).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico actualizado con éxito.', 'success');
          this.cargarMedicos();
        },
        error: (err) => {
          console.error("Error del servidor:", err);
          this.errorMsg = err.error?.message || 'Error al actualizar.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.medicoService.registrar(data).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico registrado correctamente.', 'success');
          this.cargarMedicos();
        },
        error: (err) => {
          console.error("Error del servidor:", err);
          this.errorMsg = err.error?.message || 'Hubo un error al registrar al médico.';
          this.cdr.detectChanges();
        }
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
    this.cdr.detectChanges();

    this.horarioService.listarPorMedico(idMedico).subscribe({
      next: (data) => {
        this.horarios = data;
        this.isLoadingHorarios = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingHorarios = false;
        this.errorScheduleMsg = 'No se pudieron recuperar los horarios del servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  agregarHorario(): void {
    if (!this.horarioForm.horaInicio || !this.horarioForm.horaFin) {
      this.errorScheduleMsg = 'Define las horas de inicio y fin del turno.';
      return;
    }
    this.errorScheduleMsg = '';

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
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}