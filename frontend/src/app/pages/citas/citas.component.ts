import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { PacienteService } from '../../shared/services/paciente.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { MedicoService } from '../../shared/services/medico.service';
import { HorarioMedicoService } from '../../shared/services/horario-medico.service';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './citas.component.html'
})
export class CitasComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private pacienteService = inject(PacienteService);
  private especialidadService = inject(EspecialidadService);
  private medicoService = inject(MedicoService);
  private horarioService = inject(HorarioMedicoService);
  private cdr = inject(ChangeDetectorRef);
  
  citas: any[] = [];
  citasFiltradas: any[] = []; 
  citasPaginadas: any[] = []; 
  
  searchTermCitas: string = ''; 
  cargandoCitas: boolean = false; 
  itemsPorPagina: number = 5;
  paginaActual: number = 1;

  pacientes: any[] = [];
  especialidades: any[] = [];
  medicos: any[] = [];

  isModalOpen: boolean = false;
  pasoActual: 1 | 2 = 1; 
  mostrarAlertaRegistro: boolean = false;
  validandoHorarioBackend: boolean = false;
  errorModalMsg: string = ''; 
  
  // NUEVAS VARIABLES PARA REPROGRAMAR
  isReprogramarModalOpen: boolean = false;
  citaAReprogramar: any = null;
  reprogramarForm = { fecha: '', hora: '' };

  isCancelModalOpen: boolean = false;
  citaACancelar: any = null;
  cancelForm = { motivo: '', fotoBase64: '', nombreFoto: '' };

  dniBusqueda: string = '';
  sugerenciasDni: any[] = [];
  pacienteSeleccionado: any = null;
  edadDesglosada: string = '';
  esNuevoPaciente: boolean = false;
  nuevoPacienteForm = {
    nombres: '',
    apellidoPaterno: '',
    telefono: '',
    fechaNacimiento: '2000-01-01' 
  };

  especialidadBusqueda: string = '';
  sugerenciasEspecialidad: any[] = [];
  especialidadSeleccionadaObj: any = null;
  medicosFiltradosPorEspecialidad: any[] = [];

  precioEspecialidad: number = 0;
  montoAdelanto30: number = 0;

  horariosMedicoSeleccionado: any[] = [];
  cargandoHorarios: boolean = false;

  globalMsg: string = '';
  globalMsgType: 'success' | 'error' | 'warning' | 'info' = 'info';

  citaForm = {
    idPaciente: null as number | null,
    idEspecialidad: null as number | null,
    idMedico: null as number | null,
    fecha: '',
    hora: '',
    motivoConsulta: '',
    tipoCita: 'CONSULTA', 
    montoPagadoAdelanto: 0,
    estado: 'PENDIENTE_PAGO'
  };

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarCitas();
  }

  extraerMensajeError(err: any, defaultMsg: string): string {
    if (typeof err.error === 'string') return err.error;
    if (err.error && typeof err.error === 'object') {
      return err.error.message || err.error.mensaje || err.error.error || JSON.stringify(err.error);
    }
    return defaultMsg;
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  get formularioValido(): boolean {
    if (this.esNuevoPaciente) {
      if (!this.nuevoPacienteForm.nombres || !this.nuevoPacienteForm.apellidoPaterno || !this.nuevoPacienteForm.telefono || this.nuevoPacienteForm.telefono.length !== 9) return false;
    } else {
      if (!this.citaForm.idPaciente) return false;
    }
    if (!this.citaForm.idEspecialidad || !this.citaForm.idMedico || !this.citaForm.fecha || !this.citaForm.hora || !this.citaForm.motivoConsulta) return false;
    return true;
  }

  cargarCitas(): void {
    this.cargandoCitas = true;
    this.cdr.detectChanges();
    this.citaService.listarTodas().subscribe({
      next: (data) => {
        const dataOrdenada = data.sort((a: any, b: any) => b.idCita - a.idCita);
        this.citas = dataOrdenada;
        this.citasFiltradas = dataOrdenada; 
        this.actualizarTabla();
        this.cargandoCitas = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoCitas = false; this.cdr.detectChanges(); }
    });
  }

  cargarCatalogos(): void {
    this.pacienteService.listarTodos().subscribe(data => this.pacientes = data);
    this.especialidadService.listarTodas().subscribe(data => this.especialidades = data);
    this.medicoService.listarTodos().subscribe(data => this.medicos = data);
  }

  filtrarCitas(): void {
    const term = this.searchTermCitas.toLowerCase().trim();
    if (!term) { 
      this.citasFiltradas = [...this.citas]; 
    } else {
      this.citasFiltradas = this.citas.filter(c => 
        (c.nombreCompletoPaciente && c.nombreCompletoPaciente.toLowerCase().includes(term)) ||
        (c.nombreCompletoMedico && c.nombreCompletoMedico.toLowerCase().includes(term)) ||
        (c.nombreEspecialidad && c.nombreEspecialidad.toLowerCase().includes(term)) ||
        (c.estado && c.estado.toLowerCase().includes(term)) ||
        (c.fecha && c.fecha.includes(term)) ||
        (c.dniPaciente && c.dniPaciente.toLowerCase().includes(term))
      );
    }
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.citasPaginadas = this.citasFiltradas.slice(inicio, fin);
  }

  cambiarPaginacion(): void { this.paginaActual = 1; this.actualizarTabla(); }
  paginaAnterior(): void { if (this.paginaActual > 1) { this.paginaActual--; this.actualizarTabla(); } }
  paginaSiguiente(): void { if ((this.paginaActual * this.itemsPorPagina) < this.citasFiltradas.length) { this.paginaActual++; this.actualizarTabla(); } }
  calcularRangoInicio(): number { return this.citasFiltradas.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1; }
  calcularRangoFin(): number { const fin = this.paginaActual * this.itemsPorPagina; return fin > this.citasFiltradas.length ? this.citasFiltradas.length : fin; }

  buscarDniRealTime(): void {
    this.mostrarAlertaRegistro = false;
    this.esNuevoPaciente = false;
    const term = this.dniBusqueda.trim();
    if (term.length === 0) { this.sugerenciasDni = []; this.limpiarDatosPaciente(); return; }
    
    this.sugerenciasDni = this.pacientes.filter(p => p.dni && p.dni.startsWith(term));
    if (term.length === 8 && this.sugerenciasDni.length === 0) {
      this.esNuevoPaciente = true;
      this.limpiarDatosPaciente();
    }
  }

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.dniBusqueda = paciente.dni;
    this.citaForm.idPaciente = paciente.idPaciente;
    this.sugerenciasDni = [];
    this.cdr.detectChanges();
  }

  limpiarDatosPaciente(): void {
    this.pacienteSeleccionado = null;
    this.citaForm.idPaciente = null;
  }

  buscarEspecialidadRealTime(): void {
    const term = this.especialidadBusqueda.trim().toLowerCase();
    if (term.length === 0) {
      this.sugerenciasEspecialidad = [];
      this.medicosFiltradosPorEspecialidad = [];
      this.precioEspecialidad = 0;
      this.montoAdelanto30 = 0;
      this.citaForm.idEspecialidad = null;
      this.citaForm.idMedico = null;
      this.horariosMedicoSeleccionado = [];
      return;
    }
    this.sugerenciasEspecialidad = this.especialidades.filter(e => e.nombre && e.nombre.toLowerCase().includes(term));
  }

  seleccionarEspecialidad(esp: any): void {
    this.especialidadSeleccionadaObj = esp;
    this.especialidadBusqueda = esp.nombre;
    this.citaForm.idEspecialidad = esp.idEspecialidad;
    this.sugerenciasEspecialidad = []; 
    this.horariosMedicoSeleccionado = [];

    if (esp.precioConsulta) {
      this.precioEspecialidad = esp.precioConsulta;
      this.montoAdelanto30 = Number((this.precioEspecialidad * 0.30).toFixed(2));
    } else {
      this.precioEspecialidad = 0;
      this.montoAdelanto30 = 0;
    }

    this.medicosFiltradosPorEspecialidad = this.medicos.filter(
      m => m.idEspecialidad === esp.idEspecialidad && m.estadoDisponibilidad === 'DISPONIBLE'
    );
    this.citaForm.idMedico = null; 
    this.cdr.detectChanges();
  }

  asignarMedico(idMedico: number): void {
    this.citaForm.idMedico = idMedico;
    this.cargandoHorarios = true;
    this.horariosMedicoSeleccionado = [];
    this.cdr.detectChanges(); 

    this.horarioService.listarPorMedico(idMedico).subscribe({
      next: (data) => {
        this.horariosMedicoSeleccionado = data.sort((a: any, b: any) => a.diaSemana.localeCompare(b.diaSemana));
        this.cargandoHorarios = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoHorarios = false;
        this.cdr.detectChanges();
      }
    });
  }

  irAPagar(): void {
    this.errorModalMsg = '';
    
    if (this.horariosMedicoSeleccionado.length === 0) {
      this.errorModalMsg = 'Este médico no tiene turnos programados en el sistema.';
      return;
    }

    const fechaElegida = this.citaForm.fecha; 
    const turnoDelDia = this.horariosMedicoSeleccionado.find(h => h.diaSemana === fechaElegida);
    
    if (!turnoDelDia) {
      this.errorModalMsg = `El médico no asiste a la clínica en la fecha seleccionada. Guiate de su agenda lateral.`;
      return;
    }

    const horaElegidaArr = this.citaForm.hora.split(':');
    const minsElegidos = parseInt(horaElegidaArr[0]) * 60 + parseInt(horaElegidaArr[1]);
    const inicioArr = turnoDelDia.horaInicio.split(':');
    const minsInicio = parseInt(inicioArr[0]) * 60 + parseInt(inicioArr[1]);
    const finArr = turnoDelDia.horaFin.split(':');
    const minsFin = parseInt(finArr[0]) * 60 + parseInt(finArr[1]);

    if (minsElegidos < minsInicio || minsElegidos > minsFin) {
      this.errorModalMsg = `La hora elegida está fuera del turno de trabajo del médico para ese día.`;
      return;
    }

    this.validandoHorarioBackend = true;
    this.cdr.detectChanges();

    this.citaService.validarHorario(this.citaForm.idMedico!, this.citaForm.fecha, this.citaForm.hora, this.citaForm.tipoCita).subscribe({
      next: (response: any) => {
        this.validandoHorarioBackend = false;
        if (response.disponible) {
           this.pasoActual = 2; 
           this.cdr.detectChanges();
        } else {
           this.errorModalMsg = '¡ALERTA DE CHOQUE! El médico ya tiene programada otra cita u operación en ese horario exacto.';
           this.cdr.detectChanges();
        }
      },
      error: () => {
        this.validandoHorarioBackend = false;
        this.errorModalMsg = 'Hubo un error de conexión con el servidor al validar el turno.';
        this.cdr.detectChanges();
      }
    });
  }

  regresarAPaso1(): void {
    this.pasoActual = 1;
    this.cdr.detectChanges();
  }

  confirmarPagoYape(): void {
    const payloadRapido = {
      dniPaciente: this.dniBusqueda,
      nombresPaciente: this.esNuevoPaciente ? this.nuevoPacienteForm.nombres : this.pacienteSeleccionado?.nombres,
      apellidoPaterno: this.esNuevoPaciente ? this.nuevoPacienteForm.apellidoPaterno : this.pacienteSeleccionado?.apellidoPaterno,
      apellidoMaterno: this.esNuevoPaciente ? '' : this.pacienteSeleccionado?.apellidoMaterno,
      telefonoPaciente: this.esNuevoPaciente ? this.nuevoPacienteForm.telefono : this.pacienteSeleccionado?.telefono,
      fechaNacimiento: this.esNuevoPaciente ? this.nuevoPacienteForm.fechaNacimiento : (this.pacienteSeleccionado?.fechaNacimiento || '2000-01-01'),
      idMedico: Number(this.citaForm.idMedico),
      idEspecialidad: Number(this.citaForm.idEspecialidad),
      fecha: this.citaForm.fecha,
      hora: this.citaForm.hora.length === 5 ? `${this.citaForm.hora}:00` : this.citaForm.hora,
      motivoConsulta: this.citaForm.motivoConsulta,
      tipoCita: this.citaForm.tipoCita,
      montoPagadoAdelanto: this.montoAdelanto30
    };

    this.citaService.programarCitaRapida(payloadRapido).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('¡Cita y Paciente registrados con éxito!', 'success');
        this.closeModal();
        this.cargarCitas();
      },
      error: (err) => {
        this.errorModalMsg = this.extraerMensajeError(err, 'Error al registrar la cita.');
        this.regresarAPaso1(); 
      }
    });
  }

  abrirModalCancelar(cita: any): void {
    this.citaACancelar = cita;
    this.cancelForm = { motivo: '', fotoBase64: '', nombreFoto: '' };
    this.errorModalMsg = '';
    this.isCancelModalOpen = true;
  }

  cerrarModalCancelar(): void {
    this.isCancelModalOpen = false;
    this.citaACancelar = null;
  }

  cargarEvidencia(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cancelForm.nombreFoto = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.cancelForm.fotoBase64 = e.target.result; // Convierte imagen a texto para enviarla a Java
      };
      reader.readAsDataURL(file);
    }
  }

  confirmarCancelacion(): void {
    if (!this.cancelForm.motivo || !this.cancelForm.fotoBase64) {
      this.errorModalMsg = "Debe escribir un motivo y subir la captura de la transferencia.";
      return;
    }

    this.citaService.cancelarConReembolso(this.citaACancelar.idCita, this.cancelForm.motivo, this.cancelForm.fotoBase64).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('Cita cancelada y reembolso registrado en caja exitosamente.', 'success');
        this.cerrarModalCancelar();
        this.cargarCitas();
      },
      error: (err) => {
        this.errorModalMsg = this.extraerMensajeError(err, 'No se pudo procesar la cancelación.');
        this.cdr.detectChanges();
      }
    });
  }

  // LÓGICA DE REPROGRAMACIÓN
  abrirReprogramar(cita: any): void {
    this.citaAReprogramar = cita;
    this.reprogramarForm.fecha = cita.fecha;
    this.reprogramarForm.hora = cita.hora?.substring(0,5);
    this.errorModalMsg = '';
    
    // Traemos los horarios del médico para que la secretaria vea su disponibilidad
    this.cargandoHorarios = true;
    this.horarioService.listarPorMedico(cita.idMedico).subscribe({
      next: (data) => {
        this.horariosMedicoSeleccionado = data.sort((a: any, b: any) => a.diaSemana.localeCompare(b.diaSemana));
        this.cargandoHorarios = false;
        this.cdr.detectChanges();
      }
    });
    this.isReprogramarModalOpen = true;
  }

  cerrarReprogramar(): void {
    this.isReprogramarModalOpen = false;
    this.citaAReprogramar = null;
  }

  confirmarReprogramacion(): void {
    this.errorModalMsg = '';
    if (!this.reprogramarForm.fecha || !this.reprogramarForm.hora) {
      this.errorModalMsg = 'Debe seleccionar una nueva fecha y hora.';
      return;
    }

    const turnoDelDia = this.horariosMedicoSeleccionado.find(h => h.diaSemana === this.reprogramarForm.fecha);
    if (!turnoDelDia) {
      this.errorModalMsg = 'El médico no asiste en la fecha seleccionada. Revisar agenda lateral.';
      return;
    }

    const horaElegidaArr = this.reprogramarForm.hora.split(':');
    const minsElegidos = parseInt(horaElegidaArr[0]) * 60 + parseInt(horaElegidaArr[1]);
    const inicioArr = turnoDelDia.horaInicio.split(':');
    const minsInicio = parseInt(inicioArr[0]) * 60 + parseInt(inicioArr[1]);
    const finArr = turnoDelDia.horaFin.split(':');
    const minsFin = parseInt(finArr[0]) * 60 + parseInt(finArr[1]);

    if (minsElegidos < minsInicio || minsElegidos > minsFin) {
      this.errorModalMsg = 'La hora está fuera del turno de trabajo del médico para ese día.';
      return;
    }

    this.validandoHorarioBackend = true;
    
    // Convertir hora a formato de backend ("HH:mm:00")
    const horaFormateada = this.reprogramarForm.hora.length === 5 ? `${this.reprogramarForm.hora}:00` : this.reprogramarForm.hora;

    this.citaService.reprogramarCita(this.citaAReprogramar.idCita, this.reprogramarForm.fecha, horaFormateada).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('Cita reprogramada con éxito.', 'success');
        this.validandoHorarioBackend = false;
        this.cerrarReprogramar();
        this.cargarCitas();
      },
      error: (err) => {
        this.validandoHorarioBackend = false;
        this.errorModalMsg = this.extraerMensajeError(err, 'No se pudo reprogramar la cita.');
        this.cdr.detectChanges();
      }
    });
  }

  formatearFechaLargaGlobal(fechaIso: string): string {
    if(!fechaIso || !fechaIso.includes('-')) return fechaIso; 
    const fecha = new Date(fechaIso + 'T00:00:00');
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  openModal(): void {
    this.pasoActual = 1;
    this.dniBusqueda = '';
    this.sugerenciasDni = [];
    this.errorModalMsg = '';
    this.limpiarDatosPaciente();
    
    this.especialidadBusqueda = '';
    this.sugerenciasEspecialidad = [];
    this.especialidadSeleccionadaObj = null;
    this.medicosFiltradosPorEspecialidad = [];
    this.horariosMedicoSeleccionado = [];
    this.precioEspecialidad = 0;
    this.montoAdelanto30 = 0;

    this.citaForm = { idPaciente: null, idEspecialidad: null, idMedico: null, fecha: '', hora: '', motivoConsulta: '', tipoCita: 'CONSULTA', montoPagadoAdelanto: 0, estado: 'PENDIENTE_PAGO' };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}