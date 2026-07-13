import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';
import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { ConsultaMedicaService } from '../../shared/services/consulta-medica.service';
import { RecetaMedicaService } from '../../shared/services/receta-medica.service';
import { HistoriaClinicaService } from '../../shared/services/historia-clinica.service';
import { RecetaMedicaDTO, DetalleRecetaDTO } from '../../shared/models/receta-medica.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, AlertComponent],
  templateUrl: './agenda.component.html',
  styles: [`
    ::ng-deep .fc { --fc-border-color: #e5e7eb; --fc-button-text-color: #4b5563; --fc-button-bg-color: #ffffff; --fc-button-border-color: #e5e7eb; --fc-button-hover-bg-color: #f9fafb; --fc-button-hover-border-color: #d1d5db; --fc-button-active-bg-color: #3b82f6; --fc-button-active-border-color: #3b82f6; --fc-button-active-text-color: #ffffff; --fc-today-bg-color: #f3f4f6; font-family: inherit; }
    ::ng-deep .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 700 !important; color: #111827; text-transform: capitalize; }
    ::ng-deep .fc .fc-button { padding: 0.4rem 1rem !important; font-weight: 600 !important; text-transform: capitalize !important; border-radius: 0.5rem !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transition: all 0.2s ease !important; }
    .dark ::ng-deep .fc { --fc-border-color: #374151; --fc-button-text-color: #d1d5db; --fc-button-bg-color: #1f2937; }
    
    /* ¡NUEVO! LÓGICA PARA QUE LAS CITAS NO SE SALGAN DEL CUADRO */
    ::ng-deep .fc-event { border-radius: 6px !important; padding: 2px 4px !important; margin-bottom: 4px !important; border: none !important;}
    ::ng-deep .fc-event-main { overflow: hidden; }
    ::ng-deep .fc-event-title { font-size: 0.75rem !important; font-weight: 600 !important; white-space: normal !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
    ::ng-deep .fc-daygrid-more-link { font-weight: bold; font-size: 0.75rem; color: #3b82f6 !important; padding-top: 2px; }
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
  sidebarHistorialActivo = false;

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

  sintomasTags: string[] = [];
  nuevoSintoma: string = '';

  mostrarTratamiento: boolean = false;
  mostrarReposo: boolean = false;

  busquedaMedicamento: string = '';
  resultadosMedicamentos: any[] = [];
  recomendacionesNoFarmacologicas: string = '';
  proximaCita: string = '';

  // Base de datos local mockeada del CIE-10 para el buscador
  busquedaCie10: string = '';
  resultadosCie10: any[] = [];
  cie10Base = [
    { codigo: 'J11', descripcion: 'Influenza debido a virus de la gripe no identificado' },
    { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
    { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
    { codigo: 'R50', descripcion: 'Fiebre de otro origen y de origen desconocido' },
    { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'K29', descripcion: 'Gastritis y duodenitis' }
  ];

  // Mock de Base de Datos de Medicamentos (Vademécum local)
  medicamentosBase = [
    { nombre: 'Paracetamol', presentacion: 'Tableta 500mg' },
    { nombre: 'Ibuprofeno', presentacion: 'Tableta 400mg' },
    { nombre: 'Amoxicilina', presentacion: 'Cápsula 500mg' },
    { nombre: 'Azitromicina', presentacion: 'Jarabe 250mg/5ml' },
    { nombre: 'Cetirizina', presentacion: 'Tableta 10mg' },
    { nombre: 'Loratadina', presentacion: 'Tableta 10mg' },
    { nombre: 'Diclofenaco', presentacion: 'Ampolla 75mg/3ml' },
    { nombre: 'Naproxeno', presentacion: 'Gel tópico 10%' }
  ];

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
    dayMaxEvents: 3,
    eventDisplay: 'block',
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

  globalMsg: string = '';
  globalMsgType: 'success' | 'error' | 'warning' | 'info' = 'info';

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  ngOnInit(): void { this.cargarCitasDelDia(); }

  cargarCitasDelDia(): void {
    this.isLoading = true;
    const usernameLogueado = localStorage.getItem('username')?.toLowerCase() || '';

    this.citaService.listarTodas().subscribe((data: any[]) => {
      const rolActual = localStorage.getItem('rol') || 'RECEPCIONISTA';
      const citasDelMedico = data.filter((c: any) => {
        if (rolActual === 'ADMINISTRADOR') return true;
        const esMismoMedico = c.usernameMedico && c.usernameMedico.toLowerCase() === usernameLogueado;
        const estadoValido = c.estado === 'EN_ESPERA' || c.estado === 'CONFIRMADA' || c.estado === 'ATENDIDA' || c.estado === 'PENDIENTE_PAGO';
        return esMismoMedico && estadoValido;
      });

      this.todasLasCitas = citasDelMedico;

      this.calendarOptions.events = citasDelMedico.map((cita: any) => ({
        id: cita.idCita?.toString(),
        title: `${cita.paciente?.nombres || cita.nombreCompletoPaciente || 'Paciente'} - ${cita.estado}`,
        start: `${cita.fecha}T${cita.hora}`,
        backgroundColor: this.getColorPorEstado(cita.estado),
        borderColor: this.getColorPorEstado(cita.estado),
        extendedProps: { citaCompleta: cita }
      }));

      const hoy = new Date().toISOString().split('T')[0];
      this.citasDelDia = citasDelMedico.filter(c => c.fecha === hoy);
      this.filtrarListasDelDia();
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  filtrarListasDelDia(): void {
    this.citasAtendidas = this.citasDelDia.filter(c => c.estado === 'ATENDIDA');
    this.citasPendientes = this.citasDelDia.filter(c => c.estado === 'EN_ESPERA' || c.estado === 'CONFIRMADA');
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
    if (cita.estado === 'CONFIRMADA' || cita.estado === 'PENDIENTE_PAGO') {
      this.mostrarMensajeGlobal(`Estado: ${cita.estado}. El paciente aún no cancela su recibo pendiente.`, 'warning');
    }

    this.citasDelDia = this.todasLasCitas.filter(c => c.fecha === cita.fecha);
    this.filtrarListasDelDia();
    this.verHistorialDelDia = (cita.estado === 'ATENDIDA');
    this.citaSeleccionadaId = cita.idCita;
    this.mostrarCitasLaterales = true;
    this.cdr.detectChanges();
  }

  getColorPorEstado(estado: string): string {
    switch (estado) {
      case 'EN_ESPERA': return '#10b981';
      case 'CONFIRMADA': return '#3b82f6';
      case 'PENDIENTE_PAGO': return '#facc15';
      case 'ATENDIDA': return '#8b5cf6';
      case 'CANCELADA': return '#ef4444';
      default: return '#9ca3af';
    }
  }

  seleccionarCita(cita: any): void {
    if (cita.estado !== 'EN_ESPERA') {
      this.mostrarMensajeGlobal(`No puedes iniciar. El paciente ${cita.nombreCompletoPaciente || ''} debe estar EN ESPERA.`, 'error');
      return;
    }

    this.sintomasTags = [];
    this.nuevoSintoma = '';
    this.busquedaCie10 = '';
    this.resultadosCie10 = [];
    this.mostrarTratamiento = false;
    this.mostrarReposo = false;
    this.tratamiento = { descripcion: '', fechaInicio: '', fechaFin: '' };
    this.recomendacionesNoFarmacologicas = '';
    this.proximaCita = '';
    this.busquedaMedicamento = '';
    this.resultadosMedicamentos = [];
    this.detallesReceta = [];
    this.citaSeleccionada = cita;
    this.consultaForm.motivo = cita.motivoConsulta || '';
    this.vistaActual = 'ATENCION';
    this.mostrarHistorial = true;
    this.sidebarHistorialActivo = false;
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
            this.historialConsultas = this.formatearHistorial(historia.consultasMedicas);
          } else if (historia.consultas) {
            this.historialConsultas = this.formatearHistorial(historia.consultas);
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

  guardarDatosFicha(tipo: 'ALERGIAS' | 'ANTECEDENTES') {
    if (this.guardandoHistoria) return;
    if (!this.historiaClinicaActual.idHistoriaClinica) {
      this.guardandoHistoria = true;
      const idPaciente = this.citaSeleccionada.paciente?.idPaciente || this.citaSeleccionada.idPaciente;
      this.historiaService.inicializarHistoria(idPaciente).subscribe({
        next: (nuevaHistoria: any) => {
          this.historiaClinicaActual = nuevaHistoria;
          this.aplicarYGuardarActualizacion(tipo);
        },
        error: () => {
          this.mostrarMensajeGlobal('Error al inicializar la carpeta médica del paciente.', 'error');
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

    let alergiasActuales = this.historiaClinicaActual?.alergias || '';
    let antecedentesActuales = this.historiaClinicaActual?.antecedentes || '';

    let payload = {
      antecedentes: antecedentesActuales,
      alergias: alergiasActuales,
      observacionesGenerales: this.historiaClinicaActual?.observacionesGenerales || ''
    };

    if (tipo === 'ALERGIAS' && this.nuevaAlergiaTexto.trim()) {
      let textoPrevio = payload.alergias;
      if (textoPrevio === 'Ninguna conocida.' || textoPrevio?.includes('aún no registra')) textoPrevio = '';
      payload.alergias = textoPrevio
        ? `${textoPrevio}\n[Agregado el ${fechaActual}]: ${this.nuevaAlergiaTexto}`
        : `[Agregado el ${fechaActual}]: ${this.nuevaAlergiaTexto}`;
    }

    if (tipo === 'ANTECEDENTES' && this.nuevoAntecedenteTexto.trim()) {
      let textoPrevio = payload.antecedentes;
      if (textoPrevio === 'Ninguno registrado.' || textoPrevio?.includes('aún no registra')) textoPrevio = '';
      payload.antecedentes = textoPrevio
        ? `${textoPrevio}\n[Agregado el ${fechaActual}]: ${this.nuevoAntecedenteTexto}`
        : `[Agregado el ${fechaActual}]: ${this.nuevoAntecedenteTexto}`;
    }

    this.historiaService.actualizarFichaGeneral(this.historiaClinicaActual.idHistoriaClinica, payload).subscribe({
      next: (actualizada: any) => {
        this.historiaClinicaActual = this.updatedFicha(actualizada);
        this.editandoAlergias = false;
        this.editandoAntecedentes = false;
        this.nuevaAlergiaTexto = '';
        this.nuevoAntecedenteTexto = '';
        this.guardandoHistoria = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarMensajeGlobal('Ocurrió un error en el servidor. Revisa si Java está corriendo.', 'error');
        this.guardandoHistoria = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updatedFicha(actualizada: any): any {
    return actualizada;
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
      this.busquedaMedicamento = ''; 
    }
  }
  filtrarMedicamentos(): void {
    const query = this.busquedaMedicamento.toLowerCase();
    if (!query) {
      this.resultadosMedicamentos = [];
      return;
    }
    this.resultadosMedicamentos = this.medicamentosBase.filter(m => 
      m.nombre.toLowerCase().includes(query) || m.presentacion.toLowerCase().includes(query)
    );
    // Para que si escriben algo manual, igual se asigne al modelo
    this.nuevoMedicamento.medicamento = this.busquedaMedicamento;
  }

  seleccionarMedicamento(med: any): void {
    const seleccion = `${med.nombre} - ${med.presentacion}`;
    this.nuevoMedicamento.medicamento = seleccion;
    this.busquedaMedicamento = seleccion;
    this.resultadosMedicamentos = [];
  }

  vistaPreviaReceta(): void {
    this.mostrarMensajeGlobal('Generando vista previa con firma y código QR...', 'info');
  }
  quitarMedicamento(index: number): void { this.detallesReceta.splice(index, 1); }

  guardarTodo(): void {
    if (this.sintomasTags.length === 0 || this.diagnosticos.length === 0) {
      this.mostrarMensajeGlobal('Por favor, ingresa al menos un síntoma y un diagnóstico CIE-10.', 'warning');
      return;
    }
    if (this.isSaving) return;
    this.isSaving = true;

    const sintomasUnidos = this.sintomasTags.join(', ');

    const payloadConsulta = {
      sintomas: sintomasUnidos,
      diagnosticoGeneral: JSON.stringify(this.diagnosticos),
      tratamiento: JSON.stringify({
        descripcion: this.mostrarTratamiento ? this.tratamiento.descripcion : 'Sin indicaciones médicas.',
        fechaInicio: this.mostrarReposo ? this.tratamiento.fechaInicio : '',
        fechaFin: this.mostrarReposo ? this.tratamiento.fechaFin : ''
      }),        
      observaciones: this.consultaForm.observaciones
    };

    this.consultaService.atenderCita(this.citaSeleccionada.idCita, payloadConsulta).subscribe({
      next: (consultaGuardada: any) => {
        if (this.detallesReceta.length > 0) {
          
          const textoRecomendaciones = this.recomendacionesNoFarmacologicas ? `Recomendaciones: ${this.recomendacionesNoFarmacologicas}` : 'Sin indicaciones adicionales.';
          const textoCita = this.proximaCita ? `\nPróxima cita de control: ${this.proximaCita}` : '';
          this.observacionesReceta = textoRecomendaciones + textoCita;

          const payloadReceta: RecetaMedicaDTO = {
            observaciones: this.observacionesReceta,
            idConsulta: consultaGuardada.idConsulta,
            detalles: this.detallesReceta
          };
          this.recetaService.generarReceta(payloadReceta).subscribe({
            next: () => {
              this.isSaving = false;
              this.mostrarMensajeGlobal('¡Atención y receta médica guardadas con éxito!', 'success');
              this.volverAgenda();
            },
            error: () => {
              this.isSaving = false;
              this.mostrarMensajeGlobal('Se guardó la consulta, pero ocurrió un problema con la receta.', 'warning');
              this.volverAgenda();
            }
          });
        } else {
          this.isSaving = false;
          this.mostrarMensajeGlobal('¡Atención registrada correctamente en la Historia Clínica!', 'success');
          this.volverAgenda();
        }
      },
      error: () => {
        this.isSaving = false;
        this.mostrarMensajeGlobal('Ocurrió un error al registrar la atención médica.', 'error');
      }
    });
  }

  exportarPDF(): void {
    this.mostrarMensajeGlobal('Generando PDF en segundo plano...', 'info');
  }

  // ==========================================
  //     NUEVOS PARSERS PARA RENDERIZADO UX
  // ==========================================
  get alergiasFormateadas(): { fecha: string; detalle: string }[] {
    const texto = this.historiaClinicaActual?.alergias;
    if (!texto || texto.trim() === '' || texto.includes('aún no registra') || texto === 'Ninguna conocida.') {
      return [];
    }
    return texto.split('\n').map((linea: string) => {
      const match = linea.match(/^\[Agregado el ([^\]]+)\]:\s*(.*)$/);
      if (match) return { fecha: match[1], detalle: match[2] };
      return { fecha: '', detalle: linea };
    }).filter((item: { fecha: string; detalle: string }) =>
      item.detalle.trim() !== ''
    );
  }

  get antecedentesFormateadas(): { fecha: string; detalle: string }[] {
    const texto = this.historiaClinicaActual?.antecedentes;
    if (!texto || texto.trim() === '' || texto.includes('aún no registra') || texto === 'Ninguno registrado.') {
      return [];
    }
    return texto.split('\n').map((linea: string) => {
      const match = linea.match(/^\[Agregado el ([^\]]+)\]:\s*(.*)$/);
      if (match) return { fecha: match[1], detalle: match[2] };
      return { fecha: '', detalle: linea };
    }).filter((item: { fecha: string; detalle: string }) =>
      item.detalle.trim() !== ''
    );
  }

  // --- MÉTODO PARA PARSEAR EL JSON DE LA BITÁCORA ---
  private formatearHistorial(consultas: any[]): any[] {
    return consultas.map(c => {
      let diagnosticosParsed = [];
      let tratamientoParsed = {};

      // Intentamos parsear los JSON. Si por alguna razón hay datos viejos en texto plano, el catch lo salva.
      try { 
        diagnosticosParsed = JSON.parse(c.diagnosticoGeneral); 
        if (!Array.isArray(diagnosticosParsed)) diagnosticosParsed = [];
      } catch(e) { 
        diagnosticosParsed = c.diagnosticoGeneral ? [{nombre: 'General', descripcion: c.diagnosticoGeneral}] : []; 
      }

      try { 
        tratamientoParsed = JSON.parse(c.tratamiento); 
      } catch(e) { 
        tratamientoParsed = { descripcion: c.tratamiento || 'Sin tratamiento asignado' }; 
      }

      // Retornamos la consulta original pero con dos nuevas propiedades parseadas listas para usar
      return { ...c, diagnosticosParsed, tratamientoParsed };
    });
  }

  // --- MÉTODOS PARA SÍNTOMAS (TAGS) ---
  agregarSintoma(event: Event): void {
    event.preventDefault(); // Evita que recargue la página si el Enter activa un form
    const valor = this.nuevoSintoma.trim();
    if (valor && !this.sintomasTags.includes(valor)) {
      this.sintomasTags.push(valor);
    }
    this.nuevoSintoma = '';
  }

  removerSintoma(index: number): void {
    this.sintomasTags.splice(index, 1);
  }

  // --- MÉTODOS PARA BUSCADOR CIE-10 ---
  filtrarCie10(): void {
    const query = this.busquedaCie10.toLowerCase();
    if (!query) {
      this.resultadosCie10 = [];
      return;
    }
    // Busca coincidencias en el código o en la descripción
    this.resultadosCie10 = this.cie10Base.filter(item => 
      item.codigo.toLowerCase().includes(query) || item.descripcion.toLowerCase().includes(query)
    );
  }

  seleccionarCie10(item: any): void {
    const yaExiste = this.diagnosticos.find(d => d.nombre === item.codigo);
    if (!yaExiste) {
      this.diagnosticos.push({ nombre: item.codigo, descripcion: item.descripcion });
    }
    this.busquedaCie10 = '';
    this.resultadosCie10 = [];
  }
}