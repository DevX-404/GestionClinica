import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaMedicaService } from '../../shared/services/cita-medica.service';
import { PacienteService } from '../../shared/services/paciente.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { MedicoService } from '../../shared/services/medico.service';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html'
})
export class CitasComponent implements OnInit {
  private citaService = inject(CitaMedicaService);
  private pacienteService = inject(PacienteService);
  private especialidadService = inject(EspecialidadService);
  private medicoService = inject(MedicoService);
  private cdr = inject(ChangeDetectorRef);
  
  // ==========================================
  // ESTADO DE LA TABLA Y FILTROS
  // ==========================================
  citas: any[] = [];
  citasFiltradas: any[] = []; // Nueva lista para el buscador
  searchTermCitas: string = ''; // Lo que el usuario escribe en el buscador
  cargandoCitas: boolean = false; // Control para el "Cargando..."

  // Catálogos cargados del sistema
  pacientes: any[] = [];
  especialidades: any[] = [];
  medicos: any[] = [];

  // Control del Flujo Visual
  isModalOpen: boolean = false;
  pasoActual: 1 | 2 = 1; 
  mostrarAlertaRegistro: boolean = false;
  
  // Control Predictivo del Paciente
  dniBusqueda: string = '';
  sugerenciasDni: any[] = [];
  pacienteSeleccionado: any = null;
  edadDesglosada: string = '';

  // Control Predictivo de Especialidad y Médicos
  especialidadBusqueda: string = '';
  sugerenciasEspecialidad: any[] = [];
  especialidadSeleccionadaObj: any = null;
  medicosFiltradosPorEspecialidad: any[] = [];

  // Precios Dinámicos
  precioEspecialidad: number = 0;
  montoAdelanto30: number = 0;

  // Formulario de Registro de Cita
  citaForm = {
    idPaciente: null as number | null,
    idEspecialidad: null as number | null,
    idMedico: null as number | null,
    fecha: '',
    hora: '',
    motivoConsulta: '',
    montoPagadoAdelanto: 0,
    estado: 'PENDIENTE_PAGO'
  };

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarCitas();
  }

  // --- TRAER CITAS DE LA BD ---
  cargarCitas(): void {
    this.cargandoCitas = true;
    this.cdr.detectChanges();

    this.citaService.listarTodas().subscribe({
      next: (data) => {
        this.citas = data;
        this.citasFiltradas = data; // Al inicio, muestra todas
        this.cargandoCitas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error cargando citas:", err);
        this.cargandoCitas = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarCatalogos(): void {
    this.pacienteService.listarTodos().subscribe(data => this.pacientes = data);
    this.especialidadService.listarTodas().subscribe(data => this.especialidades = data);
    this.medicoService.listarTodos().subscribe(data => this.medicos = data);
  }

  // --- NUEVO: BUSCADOR INTELIGENTE (FILTRA HASTA POR DNI) ---
  filtrarCitas(): void {
    const term = this.searchTermCitas.toLowerCase().trim();
    
    if (!term) {
      this.citasFiltradas = [...this.citas];
      return;
    }

    // Buscamos si lo que escribió coincide con algún DNI en la lista de pacientes
    const pacientesEncontrados = this.pacientes.filter(p => p.dni && p.dni.includes(term));
    const idsPacientes = pacientesEncontrados.map(p => p.idPaciente);

    this.citasFiltradas = this.citas.filter(c => 
      (c.nombreCompletoPaciente && c.nombreCompletoPaciente.toLowerCase().includes(term)) ||
      (c.nombreCompletoMedico && c.nombreCompletoMedico.toLowerCase().includes(term)) ||
      (c.nombreEspecialidad && c.nombreEspecialidad.toLowerCase().includes(term)) ||
      (c.estado && c.estado.toLowerCase().includes(term)) ||
      (c.fecha && c.fecha.includes(term)) ||
      (idsPacientes.includes(c.idPaciente)) // <-- ¡Aquí busca por DNI cruzado!
    );
  }

  // ==========================================
  // LÓGICA DE PACIENTE (DNI)
  // ==========================================
  buscarDniRealTime(): void {
    this.mostrarAlertaRegistro = false;
    const term = this.dniBusqueda.trim();

    if (term.length === 0) {
      this.sugerenciasDni = [];
      this.limpiarDatosPaciente();
      return;
    }

    this.sugerenciasDni = this.pacientes.filter(p => p.dni && p.dni.startsWith(term));

    if (term.length === 8 && this.sugerenciasDni.length === 0) {
      this.mostrarAlertaRegistro = true;
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

    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) {
      anios--;
      meses += 12;
    }
    if (hoy.getDate() < fechaNac.getDate()) {
      meses--;
      if (meses < 0) { meses = 11; }
    }
    return `${anios} años y ${meses} meses`;
  }

  // ==========================================
  // LÓGICA DE ESPECIALIDAD Y MÉDICOS
  // ==========================================
  buscarEspecialidadRealTime(): void {
    const term = this.especialidadBusqueda.trim().toLowerCase();
    
    if (term.length === 0) {
      this.sugerenciasEspecialidad = [];
      this.medicosFiltradosPorEspecialidad = [];
      this.precioEspecialidad = 0;
      this.montoAdelanto30 = 0;
      this.citaForm.idEspecialidad = null;
      this.citaForm.idMedico = null;
      return;
    }
    
    this.sugerenciasEspecialidad = this.especialidades.filter(e => 
      e.nombre && e.nombre.toLowerCase().includes(term)
    );
  }

  seleccionarEspecialidad(esp: any): void {
    this.especialidadSeleccionadaObj = esp;
    this.especialidadBusqueda = esp.nombre;
    this.citaForm.idEspecialidad = esp.idEspecialidad;
    this.sugerenciasEspecialidad = []; 

    if (esp.precioConsulta) {
      this.precioEspecialidad = esp.precioConsulta;
      this.montoAdelanto30 = Number((this.precioEspecialidad * 0.30).toFixed(2));
      this.citaForm.montoPagadoAdelanto = this.montoAdelanto30;
    } else {
      this.precioEspecialidad = 0;
      this.montoAdelanto30 = 0;
    }

    this.medicosFiltradosPorEspecialidad = this.medicos.filter(
      m => m.idEspecialidad === esp.idEspecialidad
    );
    
    this.citaForm.idMedico = null; 
    this.cdr.detectChanges();
  }

  asignarMedico(idMedico: number): void {
    this.citaForm.idMedico = idMedico;
    this.cdr.detectChanges(); 
  }

  // ==========================================
  // NAVEGACIÓN Y PAGO
  // ==========================================
  irAPagar(): void {
    if (!this.citaForm.idPaciente || !this.citaForm.idEspecialidad || !this.citaForm.idMedico || !this.citaForm.fecha || !this.citaForm.hora || !this.citaForm.motivoConsulta) {
      alert('Por favor complete todos los datos obligatorios (*) antes de proceder al pago.');
      return;
    }
    this.pasoActual = 2; 
    this.cdr.detectChanges();
  }

  regresarAPaso1(): void {
    this.pasoActual = 1;
    this.cdr.detectChanges();
  }

  confirmarPagoYape(): void {
    const citaParaEnviar = {
      idPaciente: Number(this.citaForm.idPaciente),
      idMedico: Number(this.citaForm.idMedico),
      idEspecialidad: Number(this.citaForm.idEspecialidad),
      fecha: this.citaForm.fecha, 
      hora: this.citaForm.hora && this.citaForm.hora.length === 5 ? `${this.citaForm.hora}:00` : this.citaForm.hora,
      motivoConsulta: this.citaForm.motivoConsulta,
      montoPagadoAdelanto: this.montoAdelanto30,
      estado: 'CONFIRMADA'
    };

    this.citaService.programarCita(citaParaEnviar as any).subscribe({
      next: (res) => {
        alert('¡Cita registrada con éxito!');
        this.closeModal();
        this.cargarCatalogos();
        this.cargarCitas(); // Refrescamos la lista
      },
      error: (err) => {
        console.error("Detalle del error:", err.error);
        alert('Error: ' + (err.error.message || 'No se pudo agendar la cita. Verifica los datos.'));
      }
    });
  }

  exportarVoucherPDF(): void {
    alert('Preparando motor PDF para la descarga física del comprobante del 30%...');
  }

  // ==========================================
  // CONTROL DEL MODAL
  // ==========================================
  openModal(): void {
    this.pasoActual = 1;
    
    // Limpiar Paciente
    this.dniBusqueda = '';
    this.sugerenciasDni = [];
    this.mostrarAlertaRegistro = false;
    this.limpiarDatosPaciente();
    
    // Limpiar Especialidad
    this.especialidadBusqueda = '';
    this.sugerenciasEspecialidad = [];
    this.especialidadSeleccionadaObj = null;
    this.medicosFiltradosPorEspecialidad = [];
    this.precioEspecialidad = 0;
    this.montoAdelanto30 = 0;

    // Reiniciar Formulario
    this.citaForm = { idPaciente: null, idEspecialidad: null, idMedico: null, fecha: '', hora: '', motivoConsulta: '', montoPagadoAdelanto: 0, estado: 'PENDIENTE_PAGO' };
    
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}