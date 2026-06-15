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
    ::ng-deep .fc .fc-button-primary:not(:disabled):active, ::ng-deep .fc .fc-button-primary:not(:disabled).fc-button-active { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important; }
    ::ng-deep .fc .fc-toolbar-chunk .fc-button-group { margin-left: 0.5rem; border-radius: 0.5rem; }
    ::ng-deep .fc-col-header-cell-cushion, ::ng-deep .fc-timegrid-axis-cushion, ::ng-deep .fc-timegrid-slot-label-cushion { color: #6b7280 !important; font-weight: 600 !important; font-size: 0.8rem; padding: 10px !important; }
    ::ng-deep .fc-timegrid-event { border-radius: 8px !important; border: none !important; padding: 4px 6px !important; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important; transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
    ::ng-deep .fc-timegrid-event:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; }
    ::ng-deep .fc-event-main { font-weight: 700; font-size: 0.75rem; color: white; letter-spacing: 0.025em; }
    ::ng-deep .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; border-width: 2px !important; }
    ::ng-deep .fc-timegrid-now-indicator-arrow { border-color: #ef4444 !important; border-width: 5px !important; margin-top: -4px !important; }
    .dark ::ng-deep .fc { --fc-border-color: #374151; --fc-button-text-color: #d1d5db; --fc-button-bg-color: #1f2937; --fc-button-border-color: #4b5563; --fc-button-hover-bg-color: #374151; --fc-button-hover-border-color: #6b7280; --fc-today-bg-color: rgba(55, 65, 81, 0.3); }
    .dark ::ng-deep .fc .fc-toolbar-title { color: #f9fafb; }
    .dark ::ng-deep .fc-col-header-cell-cushion, .dark ::ng-deep .fc-timegrid-axis-cushion, .dark ::ng-deep .fc-timegrid-slot-label-cushion { color: #9ca3af !important; }
  `]
})
export class AgendaComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private consultaService = inject(ConsultaMedicaService);
  private recetaService = inject(RecetaMedicaService);
  private cdr = inject(ChangeDetectorRef);

  todasLasCitas: any[] = [];
  citasDelDia: any[] = [];
  citaSeleccionada: any = null;
  consultaCreadaId: number | null = null;
  
  isLoading: boolean = false;
  isSaving: boolean = false; 

  mostrarCitasLaterales: boolean = false;

  vistaActual: 'AGENDA' | 'ATENCION' = 'AGENDA';
  pestanaActiva: 'CONSULTA' | 'RECETA' = 'CONSULTA';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay', 
    locale: esLocale,
    nowIndicator: true, 
    headerToolbar: {
      left: 'title', 
      center: '',
      right: 'prev,next today timeGridDay,timeGridWeek' 
    },
    buttonText: { today: 'Hoy', day: 'Día', week: 'Semana' },
    slotMinTime: '07:00:00', 
    slotMaxTime: '21:00:00', 
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

  ngOnInit(): void {
    this.cargarCitasDelDia();
  }

  cargarCitasDelDia(): void {
    this.isLoading = true;
    this.citaService.listarTodas().subscribe({
      next: (data: any[]) => {
        this.todasLasCitas = data;

        const eventosCalendario: EventInput[] = data.map(cita => {
          const startDateTime = `${cita.fecha}T${cita.hora}`;
          const startDate = new Date(startDateTime);
          const endDate = new Date(startDate.getTime() + 30 * 60000); 

          return {
            id: cita.idCita?.toString(),
            title: cita.paciente?.nombres || cita.nombreCompletoPaciente || 'Paciente',
            start: startDate,
            end: endDate,
            backgroundColor: this.getColorPorEstado(cita.estado),
            borderColor: 'transparent',
            extendedProps: { citaCompleta: cita } 
          };
        });

        this.calendarOptions.events = eventosCalendario;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar las citas:', err);
        this.isLoading = false;
      }
    });
  }

  handleDateClick(arg: any): void {
    const fechaSeleccionada = arg.dateStr.split('T')[0];
    this.citasDelDia = this.todasLasCitas.filter(cita =>
      (cita.estado === 'EN_ESPERA' || cita.estado === 'CONFIRMADA') && cita.fecha === fechaSeleccionada
    );
    this.mostrarCitasLaterales = true;
    this.citaSeleccionada = null;
    this.cdr.detectChanges();
  }

  handleEventClick(clickInfo: any): void {
    const cita = clickInfo.event.extendedProps['citaCompleta'];
    this.citasDelDia = this.todasLasCitas.filter(c =>
      (c.estado === 'EN_ESPERA' || c.estado === 'CONFIRMADA') && c.fecha === cita.fecha
    );
    this.citaSeleccionada = cita;
    this.mostrarCitasLaterales = true;
    this.cdr.detectChanges();
  }

  verTablaCitas(): void {
    this.citaSeleccionada = null;
  }

  getColorPorEstado(estado: string): string {
    switch(estado) {
      case 'EN_ESPERA': return '#8b5cf6'; 
      case 'CONFIRMADA': return '#3b82f6'; 
      case 'ATENDIDA': return '#10b981'; 
      case 'CANCELADA': return '#ef4444'; 
      default: return '#f59e0b'; 
    }
  }

  seleccionarCita(cita: any): void {
    this.citaSeleccionada = cita;
    this.consultaForm.motivo = cita.motivoConsulta || '';
    this.vistaActual = 'ATENCION';
    this.pestanaActiva = 'CONSULTA';
  }

  cambiarPestana(pestana: 'CONSULTA' | 'RECETA'): void {
    this.pestanaActiva = pestana;
    this.cdr.detectChanges();
  }

  agregarDiagnostico(): void {
    if (this.nuevoDiagnostico.nombre.trim()) {
      this.diagnosticos.push({ ...this.nuevoDiagnostico });
      this.nuevoDiagnostico = { nombre: '', descripcion: '' };
    }
  }

  quitarDiagnostico(index: number): void {
    this.diagnosticos.splice(index, 1);
  }

  agregarMedicamento(): void {
    if (this.nuevoMedicamento.medicamento.trim()) {
      this.detallesReceta.push({
        medicamento: this.nuevoMedicamento.medicamento,
        dosis: this.nuevoMedicamento.dosis,
        frecuencia: this.nuevoMedicamento.frecuencia,
        duracion: this.nuevoMedicamento.duracion
      });
      this.nuevoMedicamento = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };
    }
  }

  quitarMedicamento(index: number): void {
    this.detallesReceta.splice(index, 1);
  }

  guardarTodo(): void {
    if (!this.consultaForm.sintomas || this.diagnosticos.length === 0 || !this.tratamiento.descripcion) {
      alert('Por favor, ingresa los síntomas, al menos un diagnóstico y la descripción del tratamiento.');
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    // Payload de textos para que Java (Map<String, String>) no sufra un Error 400
    const payloadConsulta = {
      sintomas: this.consultaForm.sintomas,
      diagnosticoGeneral: JSON.stringify(this.diagnosticos),
      tratamiento: JSON.stringify(this.tratamiento),        
      observaciones: this.consultaForm.observaciones
    };

    this.consultaService.atenderCita(this.citaSeleccionada.idCita, payloadConsulta).subscribe({
      next: (consultaGuardada: any) => {
        this.consultaCreadaId = consultaGuardada.idConsulta;

        if (this.detallesReceta.length > 0 && this.consultaCreadaId) {
          const payloadReceta: RecetaMedicaDTO = {
            observaciones: this.observacionesReceta,
            idConsulta: this.consultaCreadaId,
            detalles: this.detallesReceta
          };
          
          this.recetaService.generarReceta(payloadReceta).subscribe({
            next: () => {
              this.isSaving = false;
              alert('¡Atención y receta médica guardadas con éxito!');
              this.volverAgenda();
            },
            error: (err) => {
              console.error('Error al generar la receta:', err);
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
      error: (err) => {
        console.error('Error al guardar la consulta:', err);
        this.isSaving = false;
        alert('Ocurrió un error al registrar la atención médica.');
      }
    });
  }

  exportarPDF(): void {
    alert('Botón PDF configurado.');
  }

  volverAgenda(): void {
    this.citaSeleccionada = null;
    this.consultaCreadaId = null;
    this.vistaActual = 'AGENDA';
    this.mostrarCitasLaterales = false;
    this.diagnosticos = [];
    this.detallesReceta = [];
    this.observacionesReceta = '';
    this.consultaForm = { motivo: '', sintomas: '', observaciones: '' };
    this.tratamiento = { descripcion: '', fechaInicio: '', fechaFin: '' };
    this.cargarCitasDelDia(); 
  }
}