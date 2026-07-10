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
  searchTermCitas: string = ''; 
  cargandoCitas: boolean = false; 

  pacientes: any[] = [];
  especialidades: any[] = [];
  medicos: any[] = [];

  isModalOpen: boolean = false;
  pasoActual: 1 | 2 = 1; 
  mostrarAlertaRegistro: boolean = false;
  validandoHorarioBackend: boolean = false; // <-- Control visual de espera
  
  dniBusqueda: string = '';
  sugerenciasDni: any[] = [];
  pacienteSeleccionado: any = null;
  edadDesglosada: string = '';
  esNuevoPaciente: boolean = false;
  nuevoPacienteForm = {
    nombres: '',
    apellidoPaterno: '',
    telefono: '',
    fechaNacimiento: '2000-01-01' // Por defecto para evitar nulos
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

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  citaForm = {
    idPaciente: null as number | null,
    idEspecialidad: null as number | null,
    idMedico: null as number | null,
    fecha: '',
    hora: '',
    motivoConsulta: '',
    tipoCita: 'CONSULTA', // <-- NUEVO: Por defecto es una consulta estándar
    montoPagadoAdelanto: 0,
    estado: 'PENDIENTE_PAGO'
  };

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarCitas();
  }

  // Traductor visual de Fechas
  formatearFechaLarga(fechaIso: string): string {
    if(!fechaIso || !fechaIso.includes('-')) return fechaIso; 
    const fecha = new Date(fechaIso + 'T00:00:00');
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-PE', opciones);
  }

  cargarCitas(): void {
    this.cargandoCitas = true;
    this.cdr.detectChanges();
    this.citaService.listarTodas().subscribe({
      next: (data) => {
        // Ordenamos las más recientes arriba
        const dataOrdenada = data.sort((a: any, b: any) => b.idCita - a.idCita);
        this.citas = dataOrdenada;
        this.citasFiltradas = dataOrdenada; 
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
    if (!term) { this.citasFiltradas = [...this.citas]; return; }
    const pacientesEncontrados = this.pacientes.filter(p => p.dni && p.dni.includes(term));
    const idsPacientes = pacientesEncontrados.map(p => p.idPaciente);

    this.citasFiltradas = this.citas.filter(c => 
      (c.nombreCompletoPaciente && c.nombreCompletoPaciente.toLowerCase().includes(term)) ||
      (c.nombreCompletoMedico && c.nombreCompletoMedico.toLowerCase().includes(term)) ||
      (c.nombreEspecialidad && c.nombreEspecialidad.toLowerCase().includes(term)) ||
      (c.estado && c.estado.toLowerCase().includes(term)) ||
      (c.fecha && c.fecha.includes(term)) ||
      (idsPacientes.includes(c.idPaciente)) 
    );
  }

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
    this.edadDesglosada = this.calcularEdadAniosMeses(paciente.fechaNacimiento);
    this.cdr.detectChanges();
  }

  limpiarDatosPaciente(): void {
    this.pacienteSeleccionado = null;
    this.citaForm.idPaciente = null;
    this.edadDesglosada = '';
  }

  calcularEdadAniosMeses(fechaNacimientoStr: string): string {
    if (!fechaNacimientoStr) return '';
    const fechaNac = new Date(fechaNacimientoStr);
    const hoy = new Date();
    let anios = hoy.getFullYear() - fechaNac.getFullYear();
    let meses = hoy.getMonth() - fechaNac.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) { anios--; meses += 12; }
    if (hoy.getDate() < fechaNac.getDate()) { meses--; if (meses < 0) { meses = 11; } }
    return `${anios} años y ${meses} meses`;
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
      this.citaForm.montoPagadoAdelanto = this.montoAdelanto30;
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

  // --- VALIDACIÓN COMBINADA: Frontend (Rango) + Backend (Choque Operaciones) ---
  irAPagar(): void {
    if (this.esNuevoPaciente) {
      if (!this.nuevoPacienteForm.nombres || !this.nuevoPacienteForm.apellidoPaterno || !this.nuevoPacienteForm.telefono) {
        this.mostrarMensajeGlobal('Complete los nombres, apellidos y teléfono del nuevo paciente.', 'warning');
        return;
      }
    } else {
      if (!this.citaForm.idPaciente) {
        this.mostrarMensajeGlobal('Debe seleccionar un paciente registrado.', 'warning');
        return;
      }
    }

    if (!this.citaForm.idEspecialidad || !this.citaForm.idMedico || !this.citaForm.fecha || !this.citaForm.hora || !this.citaForm.motivoConsulta) {
      this.mostrarMensajeGlobal('Por favor complete todos los datos obligatorios (*) antes de proceder.', 'warning');
      return;
    }

    // 1. Validación de Frontend (Verificar que la hora esté dentro del turno del médico)
    if (this.horariosMedicoSeleccionado.length === 0) {
      this.mostrarMensajeGlobal('Este médico no tiene turnos programados en el sistema.', 'warning');
      return;
    }

    const fechaElegida = this.citaForm.fecha; 
    const turnoDelDia = this.horariosMedicoSeleccionado.find(h => h.diaSemana === fechaElegida);
    
    if (!turnoDelDia) {
      this.mostrarMensajeGlobal(`El médico no tiene turno el día. Por favor, guíate de su agenda.`, 'error');
      return;
    }

    const horaElegidaArr = this.citaForm.hora.split(':');
    const minsElegidos = parseInt(horaElegidaArr[0]) * 60 + parseInt(horaElegidaArr[1]);

    const inicioArr = turnoDelDia.horaInicio.split(':');
    const minsInicio = parseInt(inicioArr[0]) * 60 + parseInt(inicioArr[1]);

    const finArr = turnoDelDia.horaFin.split(':');
    const minsFin = parseInt(finArr[0]) * 60 + parseInt(finArr[1]);

    if (minsElegidos < minsInicio || minsElegidos > minsFin) {
      this.mostrarMensajeGlobal(`La hora elegida está fuera del turno del médico para este día.`, 'error');
      return;
    }

    // 2. Validación de Backend (Verificar que no haya choques con operaciones)
    this.validandoHorarioBackend = true;
    this.cdr.detectChanges();

    this.citaService.validarHorario(this.citaForm.idMedico, this.citaForm.fecha, this.citaForm.hora, this.citaForm.tipoCita).subscribe({
      next: (response: any) => {
        this.validandoHorarioBackend = false;
        if (response.disponible) {
           this.pasoActual = 2; 
           this.cdr.detectChanges();
        } else {
           this.mostrarMensajeGlobal('¡ALERTA DE CHOQUE! El médico no está disponible. Ya tiene programada otra operación o paciente.', 'error');
           this.cdr.detectChanges();
        }
      },
      error: () => {
        this.validandoHorarioBackend = false;
        this.mostrarMensajeGlobal('Hubo un error de conexión con el servidor.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  regresarAPaso1(): void {
    this.pasoActual = 1;
    this.cdr.detectChanges();
  }

  confirmarPagoYape(): void {
    if (this.esNuevoPaciente) {
      // 1. PRIMERA TRANSACCIÓN: Crear el paciente
      const payloadPaciente = {
  tipoDocumento: 'DNI',
  dni: this.dniBusqueda,
  nombres: this.nuevoPacienteForm.nombres,
  apellidoPaterno: this.nuevoPacienteForm.apellidoPaterno,
  apellidoMaterno: '',
  fechaNacimiento: this.nuevoPacienteForm.fechaNacimiento,
  sexo: 'NO_ESPECIFICADO',
  direccion: '',
  telefono: this.nuevoPacienteForm.telefono,
  correo: '',
  estado: 'ACTIVO'
};

this.pacienteService.registrar(payloadPaciente).subscribe({
  next: (nuevoPac: any) => {
    this.citaForm.idPaciente = nuevoPac.idPaciente;
    this.ejecutarGuardadoDeCita();
  },
  error: () => {
    this.mostrarMensajeGlobal(
      'Error al registrar el nuevo paciente.',
      'error'
    );
  }
});

    } else {
      // Si ya existía, guardamos la cita de frente
      this.ejecutarGuardadoDeCita();
    }
  }

  // 2. SEGUNDA TRANSACCIÓN: Crear la cita (Tu código original encapsulado)
  private ejecutarGuardadoDeCita(): void {
    const citaParaEnviar = {
      idPaciente: Number(this.citaForm.idPaciente),
      idMedico: Number(this.citaForm.idMedico),
      idEspecialidad: Number(this.citaForm.idEspecialidad),
      fecha: this.citaForm.fecha, 
      hora: this.citaForm.hora.length === 5 ? `${this.citaForm.hora}:00` : this.citaForm.hora,
      motivoConsulta: this.citaForm.motivoConsulta,
      tipoCita: this.citaForm.tipoCita,
      montoPagadoAdelanto: this.montoAdelanto30,
      estado: 'CONFIRMADA'
    };

    this.citaService.programarCita(citaParaEnviar as any).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('¡Paciente y Cita registrados con éxito!', 'success');
        this.closeModal();
        this.cargarCatalogos(); 
        this.cargarCitas(); 
      },
      error: () => this.mostrarMensajeGlobal('Error al guardar la cita en la base de datos.', 'error')
    });
  }

  exportarVoucherPDF(): void {
    this.mostrarMensajeGlobal('Preparando PDF...', 'info');
  }

  openModal(): void {
    this.pasoActual = 1;
    this.dniBusqueda = '';
    this.sugerenciasDni = [];
    this.mostrarAlertaRegistro = false;
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