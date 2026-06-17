import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { ConsultaMedicaService } from '../../shared/services/consulta-medica.service';
import { RecetaMedicaService } from '../../shared/services/receta-medica.service';
import { HistoriaClinicaService } from '../../shared/services/historia-clinica.service';
import { RecetaMedicaDTO, DetalleRecetaDTO } from '../../shared/models/receta-medica.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './agenda.component.html',
  styles: [`
    ::ng-deep .fc { --fc-border-color: #e5e7eb; --fc-button-text-color: #4b5563; --fc-button-bg-color: #ffffff; --fc-button-border-color: #e5e7eb; --fc-button-hover-bg-color: #f9fafb; --fc-button-hover-border-color: #d1d5db; --fc-button-active-bg-color: #3b82f6; --fc-button-active-border-color: #3b82f6; --fc-button-active-text-color: #ffffff; --fc-today-bg-color: #f3f4f6; font-family: inherit; }
    ::ng-deep .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 700 !important; color: #111827; text-transform: capitalize; }
    ::ng-deep .fc .fc-button { padding: 0.4rem 1rem !important; font-weight: 600 !important; text-transform: capitalize !important; border-radius: 0.5rem !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transition: all 0.2s ease !important; }
    .dark ::ng-deep .fc { --fc-border-color: #374151; --fc-button-text-color: #d1d5db; --fc-button-bg-color: #1f2937; }
  `]
})
export class AgendaComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private consultaService = inject(ConsultaMedicaService);
  private recetaService = inject(RecetaMedicaService);
  private historiaService = inject(HistoriaClinicaService);
  private cdr = inject(ChangeDetectorRef);

  todasLasCitas: any[] = [];
  citasDelDia: any[] = [];
  citasPendientes: any[] = [];
  citasAtendidas: any[] = [];
  
  citaSeleccionada: any = null;
  citaSeleccionadaId: number | null = null;
  consultaCreadaId: number | null = null;
  
  historiaClinicaActual: any = null; 
  historialConsultas: any[] = []; 
  isLoadingHistoria: boolean = false;

  // --- VARIABLES PARA EDITAR HISTORIAL ---
  editandoAlergias = false;
  editandoAntecedentes = false;
  nuevaAlergiaTexto = '';
  nuevoAntecedenteTexto = '';
  guardandoHistoria = false;
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  mostrarCitasLaterales: boolean = false;
  mostrarHistorial: boolean = false;
  verHistorialDelDia: boolean = false;

  vistaActual: 'AGENDA' | 'ATENCION' = 'AGENDA';
  pestanaActiva: 'CONSULTA' | 'RECETA' = 'CONSULTA';

  get listaCitasMostrar(): any[] {
    return this.verHistorialDelDia ? this.citasAtendidas : this.citasPendientes;
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    headerToolbar: { left: 'title', center: '', right: 'prev,next dayGridMonth,timeGridWeek,timeGridDay' },
    buttonText: { month: 'Mes', week: 'Semana', day: 'Día' },
    allDaySlot: false,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this)
  };

  consultaForm = { motivo: '', sintomas: '', observaciones: '' };
  diagnosticos: { nombre: string, descripcion: string }[] = [];
  nuevoDiagnostico = { nombre: '', descripcion: '' };
  tratamiento = { descripcion: '', fechaInicio: '', fechaFin: '' };
  detallesReceta: DetalleRecetaDTO[] = [];
  nuevoMedicamento = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };
  observacionesReceta: string = '';

  ngOnInit(): void { this.cargarCitasDelDia(); }

  cargarCitasDelDia(): void {
    this.isLoading = true;
    this.citaService.listarTodas().subscribe((data: any[]) => {
      this.todasLasCitas = data;
      this.calendarOptions.events = data.map((cita: any) => ({
        id: cita.idCita?.toString(),
        title: cita.paciente?.nombres || cita.nombreCompletoPaciente || 'Paciente',
        start: `${cita.fecha}T${cita.hora}`,
        backgroundColor: this.getColorPorEstado(cita.estado),
        extendedProps: { citaCompleta: cita }
      }));
      const hoy = new Date().toISOString().split('T')[0];
      this.citasDelDia = data.filter(c => c.fecha === hoy);
      this.filtrarListasDelDia();
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  filtrarListasDelDia(): void {
    this.citasAtendidas = this.citasDelDia.filter(c => c.estado === 'ATENDIDA' || c.estado === 'CANCELADA');
    this.citasPendientes = this.citasDelDia.filter(c => c.estado !== 'ATENDIDA' && c.estado !== 'CANCELADA');
  }

  handleDateClick(arg: any): void {
    this.citasDelDia = this.todasLasCitas.filter(c => c.fecha === arg.dateStr.split('T')[0]);
    this.filtrarListasDelDia();
    this.mostrarCitasLaterales = true;
    this.verHistorialDelDia = false;
    this.citaSeleccionada = null;
    this.citaSeleccionadaId = null;
    this.cdr.detectChanges();
  }

  handleEventClick(arg: any): void {
    const cita = arg.event.extendedProps['citaCompleta'];
    this.citasDelDia = this.todasLasCitas.filter(c => c.fecha === cita.fecha);
    this.filtrarListasDelDia();
    this.verHistorialDelDia = (cita.estado === 'ATENDIDA' || cita.estado === 'CANCELADA');
    this.citaSeleccionadaId = cita.idCita;
    this.mostrarCitasLaterales = true;
    this.cdr.detectChanges();
  }

  getColorPorEstado(estado: string): string {
    switch(estado) {
      case 'EN_ESPERA': return '#8b5cf6';
      case 'CONFIRMADA': return '#3b82f6';
      case 'ATENDIDA': return '#10b981';
      case 'CANCELADA': return '#ef4444';
      default: return '#facc15';
    }
  }

  seleccionarCita(cita: any): void {
    this.citaSeleccionada = cita;
    this.consultaForm.motivo = cita.motivoConsulta || '';
    this.vistaActual = 'ATENCION';
    this.mostrarHistorial = true;
    this.pestanaActiva = 'CONSULTA';
    this.historiaClinicaActual = null;
    this.historialConsultas = []; 
    this.editandoAlergias = false;
    this.editandoAntecedentes = false;
    this.nuevaAlergiaTexto = '';
    this.nuevoAntecedenteTexto = '';

    const idPaciente = cita.paciente?.idPaciente || cita.idPaciente; 
    
    if (idPaciente) {
      this.isLoadingHistoria = true;
      this.historiaService.obtenerPorPaciente(idPaciente).subscribe({
        next: (historia: any) => {
          this.historiaClinicaActual = historia;
          if (historia.consultasMedicas) {
            this.historialConsultas = historia.consultasMedicas;
          } else if (historia.consultas) {
            this.historialConsultas = historia.consultas;
          }
          this.isLoadingHistoria = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.historiaClinicaActual = { 
            alergias: "El paciente aún no registra alergias.", 
            antecedentes: "El paciente aún no registra antecedentes médicos." 
          };
          this.historialConsultas = [];
          this.isLoadingHistoria = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }

  // --- NUEVA LÓGICA DE GUARDADO AUTOMÁTICO DE FECHAS ---
  guardarDatosFicha(tipo: 'ALERGIAS' | 'ANTECEDENTES') {
    if (this.guardandoHistoria) return;
    
    // Si el paciente es nuevecito, primero lo creamos en la base de datos
    if (!this.historiaClinicaActual.idHistoriaClinica) {
      this.guardandoHistoria = true;
      const idPaciente = this.citaSeleccionada.paciente?.idPaciente || this.citaSeleccionada.idPaciente;
      this.historiaService.inicializarHistoria(idPaciente).subscribe({
        next: (nuevaHistoria: any) => {
          this.historiaClinicaActual = nuevaHistoria;
          this.aplicarYGuardarActualizacion(tipo);
        },
        error: () => {
          alert('Error al inicializar la carpeta médica del paciente.');
          this.guardandoHistoria = false;
        }
      });
    } else {
      this.aplicarYGuardarActualizacion(tipo);
    }
  }

  private aplicarYGuardarActualizacion(tipo: 'ALERGIAS' | 'ANTECEDENTES') {
    this.guardandoHistoria = true;
    const fechaActual = new Date().toLocaleDateString('es-PE');
    
    // SOLUCIÓN AL ERROR NULL: Convertimos a string vacío si viene null de la BD
    let alergiasActuales = this.historiaClinicaActual?.alergias || '';
    let antecedentesActuales = this.historiaClinicaActual?.antecedentes || '';

    let payload = {
      antecedentes: antecedentesActuales,
      alergias: alergiasActuales,
      observacionesGenerales: this.historiaClinicaActual?.observacionesGenerales || ''
    };

    if (tipo === 'ALERGIAS' && this.nuevaAlergiaTexto.trim()) {
      let textoPrevio = payload.alergias;
      // Usamos ?.includes por si textoPrevio es nulo
      if (textoPrevio === 'Ninguna conocida.' || textoPrevio?.includes('aún no registra')) textoPrevio = '';
      payload.alergias = textoPrevio 
        ? `${textoPrevio}\n[Agregado el ${fechaActual}]: ${this.nuevaAlergiaTexto}` 
        : `[Agregado el ${fechaActual}]: ${this.nuevaAlergiaTexto}`;
    }

    if (tipo === 'ANTECEDENTES' && this.nuevoAntecedenteTexto.trim()) {
      let textoPrevio = payload.antecedentes;
      // Usamos ?.includes por si textoPrevio es nulo
      if (textoPrevio === 'Ninguno registrado.' || textoPrevio?.includes('aún no registra')) textoPrevio = '';
      payload.antecedentes = textoPrevio 
        ? `${textoPrevio}\n[Agregado el ${fechaActual}]: ${this.nuevoAntecedenteTexto}` 
        : `[Agregado el ${fechaActual}]: ${this.nuevoAntecedenteTexto}`;
    }

    this.historiaService.actualizarFichaGeneral(this.historiaClinicaActual.idHistoriaClinica, payload).subscribe({
      next: (actualizada: any) => {
        this.historiaClinicaActual = actualizada;
        this.editandoAlergias = false;
        this.editandoAntecedentes = false;
        this.nuevaAlergiaTexto = '';
        this.nuevoAntecedenteTexto = '';
        this.guardandoHistoria = false; // Se apaga el loader
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error del backend:", err);
        alert('Ocurrió un error en el servidor. Revisa si Java está corriendo.');
        this.guardandoHistoria = false;
        this.cdr.detectChanges();
      }
    });
  }

  comenzarConsultaReal() { this.mostrarHistorial = false; this.cdr.detectChanges(); }
  cambiarPestana(p: 'CONSULTA' | 'RECETA') { this.pestanaActiva = p; this.cdr.detectChanges(); }
  volverAgenda() { this.vistaActual = 'AGENDA'; this.citaSeleccionada = null; this.cargarCitasDelDia(); }
  
  agregarDiagnostico(): void {
    if (this.nuevoDiagnostico.nombre.trim()) {
      this.diagnosticos.push({ ...this.nuevoDiagnostico });
      this.nuevoDiagnostico = { nombre: '', descripcion: '' };
    }
  }
  quitarDiagnostico(index: number): void { this.diagnosticos.splice(index, 1); }

  agregarMedicamento(): void {
    if (this.nuevoMedicamento.medicamento.trim()) {
      this.detallesReceta.push({ ...this.nuevoMedicamento });
      this.nuevoMedicamento = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };
    }
  }
  quitarMedicamento(index: number): void { this.detallesReceta.splice(index, 1); }

  guardarTodo(): void {
    if (!this.consultaForm.sintomas || this.diagnosticos.length === 0 || !this.tratamiento.descripcion) {
      alert('Por favor, ingresa los síntomas, al menos un diagnóstico y la descripción del tratamiento.');
      return;
    }
    if (this.isSaving) return;
    this.isSaving = true;

    const payloadConsulta = {
      sintomas: this.consultaForm.sintomas,
      diagnosticoGeneral: JSON.stringify(this.diagnosticos),
      tratamiento: JSON.stringify(this.tratamiento),        
      observaciones: this.consultaForm.observaciones
    };

    this.consultaService.atenderCita(this.citaSeleccionada.idCita, payloadConsulta).subscribe({
      next: (consultaGuardada: any) => {
        if (this.detallesReceta.length > 0) {
          const payloadReceta: RecetaMedicaDTO = {
            observaciones: this.observacionesReceta,
            idConsulta: consultaGuardada.idConsulta,
            detalles: this.detallesReceta
          };
          this.recetaService.generarReceta(payloadReceta).subscribe({
            next: () => {
              this.isSaving = false;
              alert('¡Atención y receta médica guardadas con éxito!');
              this.volverAgenda();
            },
            error: () => {
              this.isSaving = false;
              alert('Se guardó la consulta, pero ocurrió un problema con la receta.');
              this.volverAgenda();
            }
          });
        } else {
          this.isSaving = false;
          alert('¡Atención registrada correctamente en la Historia Clínica!');
          this.volverAgenda();
        }
      },
      error: () => {
        this.isSaving = false;
        alert('Ocurrió un error al registrar la atención médica.');
      }
    });
  }
  exportarPDF(): void { alert('Botón PDF configurado.'); }
}