import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicoService } from '../../shared/services/medico.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { HorarioMedicoService } from '../../shared/services/horario-medico.service';
import { Medico } from '../../shared/models/medico.model';
import { Especialidad } from '../../shared/models/especialidad.model';
import { HorarioMedico } from '../../shared/models/horario-medico.model';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medicos.component.html'
})
export class MedicosComponent implements OnInit {
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);
  private horarioService = inject(HorarioMedicoService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // DATOS
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  medicosPaginados: Medico[] = []; // NUEVO: Para la paginación de la tabla
  especialidades: Especialidad[] = [];
  horarios: HorarioMedico[] = [];
  
  // CONTROLES DE LA TABLA
  searchTerm: string = '';
  filtroEstado: string = ''; // NUEVO: Para filtrar por disponibilidad
  itemsPorPagina: number = 5;
  paginaActual: number = 1;

  isLoading: boolean = false;
  isLoadingHorarios: boolean = false;
  
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  isModalOpen: boolean = false;
  isEditing: boolean = false;
  errorMsg: string = '';
  
  medicoForm: FormGroup;
  cmpActual: string = '';

  isScheduleModalOpen: boolean = false;
  medicoSeleccionado?: Medico;
  errorScheduleMsg: string = '';
  
  horarioForm = {
    fechaTurno: '', 
    horaInicio: '',
    horaFin: ''
  };

  constructor() {
    this.medicoForm = this.fb.group({
      idMedico: [null],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]], 
      correo: ['', [Validators.email]],
      idEspecialidad: [0, Validators.required],
      estadoDisponibilidad: ['DISPONIBLE']
    });
  }

  ngOnInit(): void {
    // Es importante cargar primero las especialidades para poder cruzar los nombres en la tabla
    this.cargarEspecialidades();
    this.cargarMedicos();
  }

  formatearFechaLarga(fechaIso: string): string {
    if(!fechaIso || !fechaIso.includes('-')) return fechaIso; 
    const fecha = new Date(fechaIso + 'T00:00:00'); 
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let texto = fecha.toLocaleDateString('es-PE', opciones);
    return texto;
  }

  cargarEspecialidades(): void {
    this.especialidadService.listarTodas().subscribe({
      next: (data) => this.especialidades = data,
      error: (err) => console.error('Error al cargar especialidades', err)
    });
  }

  // --- FUNCIÓN PARA OBTENER EL NOMBRE DE LA ESPECIALIDAD ---
  getNombreEspecialidad(idEspecialidad: number): string {
    const esp = this.especialidades.find(e => e.idEspecialidad === idEspecialidad);
    return esp ? esp.nombre : 'Sin Especialidad';
  }

  cargarMedicos(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.medicoService.listarTodos().subscribe({
      next: (data) => {
        // Orden de llegada: Los ID más altos (más recientes) arriba
        const dataOrdenada = data.sort((a, b) => (b.idMedico || 0) - (a.idMedico || 0));
        
        this.medicos = dataOrdenada;
        this.filtrar(); // Llamamos al filtro para que inicialice la tabla
        
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

  // --- BUSCADOR Y FILTROS CORREGIDOS ---
  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.medicosFiltrados = this.medicos.filter(m => {
      const nombreCompleto = `${m.nombres} ${m.apellidoPaterno} ${m.apellidoMaterno}`.toLowerCase();
      const cmp = (m.codigoColegiatura || '').toLowerCase();
      const especialidad = this.getNombreEspecialidad(m.idEspecialidad).toLowerCase(); // Ahora cruzamos la especialidad
      const estado = m.estadoDisponibilidad || '';

      // Match Buscador de texto (Nombre, CMP o Especialidad)
      const matchSearch = term === '' || 
                          nombreCompleto.includes(term) || 
                          cmp.includes(term) || 
                          especialidad.includes(term);
      
      // Match Select de Disponibilidad
      const matchEstado = this.filtroEstado === '' || estado === this.filtroEstado;

      return matchSearch && matchEstado;
    });

    // Resetear paginación al buscar
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.medicosPaginados = this.medicosFiltrados.slice(inicio, fin);
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
    if ((this.paginaActual * this.itemsPorPagina) < this.medicosFiltrados.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.medicosFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.medicosFiltrados.length ? this.medicosFiltrados.length : fin;
  }
  // --- FIN LÓGICA PAGINACIÓN ---

  generarCMPAleatorio(): string {
    const numeroAleatorio = Math.floor(10000 + Math.random() * 90000); 
    return `CMP-${numeroAleatorio}`;
  }

  openModal(medico?: Medico): void {
    this.errorMsg = '';
    if (medico) {
      this.isEditing = true;
      this.medicoForm.patchValue(medico);
      this.cmpActual = medico.codigoColegiatura; 
    } else {
      this.isEditing = false;
      this.cmpActual = this.generarCMPAleatorio(); 
      this.medicoForm.reset({
        estadoDisponibilidad: 'DISPONIBLE',
        idEspecialidad: 0,
        correo: `${this.cmpActual.toLowerCase()}@clinica.com` 
      });
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  validarTelefono(event: any) {
    const input = event.target;
    let valorFiltrado = input.value.replace(/[^0-9]/g, '');
    if (valorFiltrado.length > 9) {
      valorFiltrado = valorFiltrado.substring(0, 9);
    }
    input.value = valorFiltrado;
    this.medicoForm.controls['telefono'].setValue(valorFiltrado);
  }

  guardarMedico(): void {
    if (this.medicoForm.invalid) {
      this.errorMsg = 'Por favor, corrige los errores en el formulario.';
      this.medicoForm.markAllAsTouched();
      return;
    }
    
    let data = this.medicoForm.value;
    data.codigoColegiatura = this.cmpActual;
    
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

  openScheduleModal(medico: Medico): void {
    this.medicoSeleccionado = medico;
    this.errorScheduleMsg = '';
    this.horarioForm = { fechaTurno: '', horaInicio: '', horaFin: '' };
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
        // Ordenamos los turnos del más antiguo al más futuro
        this.horarios = data.sort((a: any, b: any) => a.diaSemana.localeCompare(b.diaSemana));
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
    if (!this.horarioForm.fechaTurno || !this.horarioForm.horaInicio || !this.horarioForm.horaFin) {
      this.errorScheduleMsg = 'Define la fecha exacta y las horas de inicio y fin del turno.';
      return;
    }
    this.errorScheduleMsg = '';

    const nuevoHorario: HorarioMedico = {
      idMedico: this.medicoSeleccionado!.idMedico!,
      diaSemana: this.horarioForm.fechaTurno, // Inyectamos la fecha real aquí
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
        this.errorScheduleMsg = err.error?.message || 'Error al guardar el turno.';
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