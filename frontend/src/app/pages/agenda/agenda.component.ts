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
import { CitaMedica } from '../../shared/models/cita-medica.model';
import { ConsultaMedicaService } from '../../shared/services/consulta-medica.service';
import { RecetaMedicaService } from '../../shared/services/receta-medica.service';
import { ConsultaMedica, RecetaMedicaDTO, DetalleRecetaDTO } from '../../shared/models/atencion-clinica.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FullCalendarModule,FormsModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private consultaService = inject(ConsultaMedicaService); // <-- AÑADIDO
  private recetaService = inject(RecetaMedicaService);
  private cdr = inject(ChangeDetectorRef);

  // Simulación: En producción sacarías el ID del token JWT del médico logueado
  medicoLogueadoId: number = 1; 

  citasDelDia: CitaMedica[] = [];
  citaSeleccionada: CitaMedica | null = null;
  isLoading: boolean = false;

  // ==========================================
  // VARIABLES DE LA FASE 3 (ATENCIÓN CLÍNICA)
  // ==========================================
  mostrarFormAtencion: boolean = false;
  mostrarFormReceta: boolean = false;

  consulta: ConsultaMedica = {
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: ''
  };

  receta: RecetaMedicaDTO = {
    idConsulta: 0,
    observaciones: '',
    detalles: []
  };

  nuevoDetalle: DetalleRecetaDTO = {
    medicamento: '',
    dosis: '',
    frecuencia: '',
    duracion: ''
  };
  // ==========================================

  // Configuración del Calendario
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay', // Empieza viendo el día actual por horas
    locale: esLocale, // Calendario en español
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth'
    },
    slotMinTime: '07:00:00', // El calendario empieza a las 7 AM
    slotMaxTime: '21:00:00', // Termina a las 9 PM
    allDaySlot: false,
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };

  ngOnInit(): void {
    this.cargarAgenda();
  }

  cargarAgenda(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.citaService.listarPorMedico(this.medicoLogueadoId).subscribe({
      next: (citas) => {
        // 1. Mapear citas para el Calendario
        const eventosCalendario: EventInput[] = citas.map(cita => {
          // Calculamos la hora de fin (asumiendo 30 min por consulta)
          const startDateTime = `${cita.fecha}T${cita.hora}`;
          const startDate = new Date(startDateTime);
          const endDate = new Date(startDate.getTime() + 30 * 60000); 

          return {
            id: cita.idCita?.toString(),
            title: cita.nombreCompletoPaciente,
            start: startDate,
            end: endDate,
            backgroundColor: this.getColorPorEstado(cita.estado),
            borderColor: 'transparent',
            extendedProps: { citaCompleta: cita } // Guardamos la data original aquí
          };
        });

        this.calendarOptions.events = eventosCalendario;

        // 2. Filtrar citas de "Hoy" para la tabla lateral
        const hoy = new Date().toISOString().split('T')[0];
        this.citasDelDia = citas.filter(c => c.fecha === hoy);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleEventClick(clickInfo: any): void {
    // Al hacer clic en un evento, cargamos la data en el panel derecho
    this.citaSeleccionada = clickInfo.event.extendedProps['citaCompleta'];
  }

  verTablaCitas(): void {
    // Botón para volver a la tabla desde el detalle
    this.citaSeleccionada = null;
  }

  iniciarAtencion(): void {
    // Aquí irías al módulo de Consulta Médica e Historia Clínica
    console.log('Iniciando atención para la cita ID:', this.citaSeleccionada?.idCita);
    alert(`Redirigiendo a la historia clínica de ${this.citaSeleccionada?.nombreCompletoPaciente}`);
  }

  getColorPorEstado(estado: string): string {
    switch(estado) {
      case 'PENDIENTE': return '#f59e0b'; // Amarillo
      case 'CONFIRMADA': return '#3b82f6'; // Azul
      case 'ATENDIDA': return '#10b981'; // Verde
      case 'CANCELADA': return '#ef4444'; // Rojo
      default: return '#6b7280';
    }
  }

  // ==========================================
  // MÉTODOS DE LA FASE 3 (FLUJO DEL MÉDICO)
  // ==========================================

  guardarAtencion(): void {
    if (!this.consulta.sintomas || !this.consulta.diagnostico || !this.consulta.tratamiento) {
      alert('Por favor, completa los campos obligatorios: Síntomas, Diagnóstico y Tratamiento.');
      this.cdr.detectChanges();
      return;
    }

    const bodyConsulta = {
      sintomas: this.consulta.sintomas,
      diagnostico: this.consulta.diagnostico,
      tratamiento: this.consulta.tratamiento,
      observaciones: this.consulta.observaciones || ''
    };

    // Usamos el ID de la cita que seleccionaste en el calendario
    this.consultaService.atenderCita(this.citaSeleccionada!.idCita!, bodyConsulta).subscribe({
      next: (consultaCreada) => {
        alert('¡Atención Médica registrada! La cita ahora es ATENDIDA.');
        
        // Preparamos el formulario de recetas
        this.receta.idConsulta = consultaCreada.idConsulta!;
        this.receta.detalles = [];
        this.receta.observaciones = '';
        
        this.mostrarFormAtencion = false;
        this.mostrarFormReceta = true;
        this.cargarAgenda(); // Refrescamos para que se ponga en verde en el calendario
      },
      error: (err) => {
        alert('Error al registrar la atención: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  agregarMedicamento(): void {
    if (!this.nuevoDetalle.medicamento || !this.nuevoDetalle.dosis || !this.nuevoDetalle.frecuencia || !this.nuevoDetalle.duracion) {
      alert('Por favor, rellena todos los campos del medicamento.');
      this.cdr.detectChanges();
      return;
    }
    this.receta.detalles.push({ ...this.nuevoDetalle });
    this.nuevoDetalle = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };
  }

  eliminarMedicamento(index: number): void {
    this.receta.detalles.splice(index, 1);
  }

  guardarRecetaCompleta(): void {
    this.recetaService.generarReceta(this.receta).subscribe({
      next: () => {
        alert('¡Receta médica generada correctamente con sus detalles! Flujo terminado.');
        this.limpiarYRegresar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al guardar la receta: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  limpiarYRegresar(): void {
    this.citaSeleccionada = null;
    this.mostrarFormAtencion = false;
    this.mostrarFormReceta = false;
  }
}