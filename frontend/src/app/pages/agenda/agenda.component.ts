import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { CitaMedica } from '../../shared/models/cita-medica.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit {
  private citaService = inject(CitaMedicaService);

  // Simulación: En producción sacarías el ID del token JWT del médico logueado
  medicoLogueadoId: number = 1; 

  citasDelDia: CitaMedica[] = [];
  citaSeleccionada: CitaMedica | null = null;
  isLoading: boolean = false;

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
      },
      error: () => this.isLoading = false
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
}