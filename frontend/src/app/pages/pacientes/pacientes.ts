import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paciente } from '../../shared/models/paciente.model';
import { PacienteService } from '../../shared/services/paciente.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html'
})
export class PacientesComponent implements OnInit {
  pacientes: Paciente[] = [];
  
  searchTerm: string = '';
  sortOrder: string = 'desc'; 
  pageSize: number = 5;
  currentPage: number = 1;

  isModalOpen: boolean = false;
  isEditing: boolean = false;

  dniInvalido: boolean = false;
  telefonoInvalido: boolean = false;
  fechaFuturaInvalida: boolean = false;

  pacienteForm: Paciente = this.resetForm();

  errorMsg: string = '';
  successMsg: string = '';

  isLoading: boolean = false; 
  globalMsg: string = ''; 
  globalMsgType: 'success' | 'error' = 'success';

  verInactivos: boolean = false;
  rolActual: string = '';

  constructor(private pacienteService: PacienteService, private cdr: ChangeDetectorRef) {}

  // --- INICIO: LÓGICA DE CONFIRMACIÓN ELEGANTE ---
  isConfirmModalOpen: boolean = false;
  confirmData: any = { titulo: '', mensaje: '', txtBtn: '', colorBtn: '', accion: null, accionCancelar: null };

  abrirConfirmacion(titulo: string, mensaje: string, txtBtn: string, colorBtn: string, accion: () => void, accionCancelar?: () => void): void {
    this.confirmData = { titulo, mensaje, txtBtn, colorBtn, accion, accionCancelar };
    this.isConfirmModalOpen = true;
  }

  cerrarConfirmacion(): void {
    if (this.confirmData.accionCancelar) this.confirmData.accionCancelar();
    this.isConfirmModalOpen = false;
  }

  ejecutarConfirmacion(): void {
    if (this.confirmData.accion) this.confirmData.accion();
    this.isConfirmModalOpen = false;
  }
  // --- FIN: LÓGICA DE CONFIRMACIÓN ELEGANTE ---

  ngOnInit(): void {
    this.rolActual = localStorage.getItem('rol') || '';
    this.cargarPacientes();
  }

  toggleVistaInactivos(): void {
    this.verInactivos = !this.verInactivos;
    this.currentPage = 1; 
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.isLoading = true; 
    this.cdr.detectChanges();

    const request = this.verInactivos ? this.pacienteService.listarInactivos() : this.pacienteService.listarTodos();

    request.subscribe({
      next: (data) => {
        this.pacientes = data;
        this.isLoading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al conectar con el servidor.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  get listaFiltrada(): Paciente[] {
    let result = this.pacientes;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.nombres.toLowerCase().includes(term) ||
        p.apellidoPaterno.toLowerCase().includes(term) ||
        p.dni.includes(term)
      );
    }
    result = result.sort((a, b) => {
      const idA = a.idPaciente || 0;
      const idB = b.idPaciente || 0;
      return this.sortOrder === 'desc' ? idB - idA : idA - idB;
    });
    return result;
  }

  get filteredPacientes(): Paciente[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.listaFiltrada.slice(startIndex, startIndex + this.pageSize);
  }

  get totalEntradas(): number {
    return this.listaFiltrada.length;
  }

  nextPage(): void {
    if ((this.currentPage * this.pageSize) < this.totalEntradas) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  openModal(paciente?: Paciente): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.dniInvalido = false;
    this.telefonoInvalido = false;
    this.fechaFuturaInvalida = false;
    this.isModalOpen = true;

    if (paciente) {
      this.isEditing = true;
      this.pacienteForm = { ...paciente };
    } else {
      this.isEditing = false;
      this.pacienteForm = this.resetForm();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  cambioTipoDocumento(): void {
    if (!this.isEditing) {
      this.pacienteForm.dni = '';
      this.dniInvalido = false;
    }
  }

  validarDocumento(event: any): void {
    const input = event.target;
    if (this.pacienteForm.tipoDocumento === 'DNI') {
      let valor = input.value.replace(/[^0-9]/g, ''); 
      if (valor.length > 8) valor = valor.substring(0, 8); 
      input.value = valor;
      this.pacienteForm.dni = valor;
      this.dniInvalido = valor.length > 0 && valor.length < 8; 
    } else {
      this.dniInvalido = false;
    }
  }

  validarTelefono(event: any): void {
    const input = event.target;
    let valor = input.value.replace(/[^0-9]/g, ''); 
    if (valor.length > 9) valor = valor.substring(0, 9); 
    input.value = valor;
    this.pacienteForm.telefono = valor;
    this.telefonoInvalido = valor.length > 0 && valor.length < 9; 
  }

  validarFecha(event: any): void {
    const fechaSeleccionada = new Date(event.target.value);
    const hoy = new Date();
    fechaSeleccionada.setHours(0,0,0,0);
    hoy.setHours(0,0,0,0);
    this.fechaFuturaInvalida = fechaSeleccionada > hoy;
  }

  get esFormularioValido(): boolean {
    const p = this.pacienteForm;
    const docInvalido = p.tipoDocumento === 'DNI' ? (!p.dni || p.dni.length !== 8) : !p.dni;
    const faltanCampos = !p.nombres || !p.apellidoPaterno || !p.apellidoMaterno || !p.fechaNacimiento || !p.telefono || p.telefono.length !== 9;
    return !docInvalido && !faltanCampos && !this.fechaFuturaInvalida;
  }

  extraerMensajeError(err: any, mensajePorDefecto: string): string {
    if (typeof err.error === 'string') {
      return err.error; // Si es un texto plano, lo mostramos directo
    } else if (err.error && typeof err.error === 'object') {
      // Buscamos las propiedades más comunes que usa Spring Boot
      return err.error.message || err.error.mensaje || err.error.details || err.error.error || JSON.stringify(err.error);
    }
    return mensajePorDefecto;
  }

  guardarPaciente(): void {
    if (!this.esFormularioValido) return; // Doble candado

    if (this.isEditing && this.pacienteForm.idPaciente) {
      this.pacienteService.actualizar(this.pacienteForm.idPaciente, this.pacienteForm).subscribe({
        next: () => {
          this.closeModal(); 
          this.mostrarMensajeGlobal('¡Paciente actualizado con éxito!', 'success');
          this.cargarPacientes();
        },
        error: (err) => {
          this.errorMsg = this.extraerMensajeError(err, 'Ocurrió un error al actualizar los datos.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.pacienteService.registrar(this.pacienteForm).subscribe({
        next: () => {
          this.closeModal(); 
          this.mostrarMensajeGlobal('¡Paciente registrado e Historia Clínica inicializada!', 'success');
          this.cargarPacientes();
        },
        error: (err) => {
          this.errorMsg = this.extraerMensajeError(err, 'Ocurrió un error al registrar al paciente.');
          this.cdr.detectChanges();
        }
      });
    }
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

  cambiarEstado(paciente: Paciente): void {
    if (paciente.idPaciente) {
      if (paciente.estado === 'ACTIVO') {
        this.abrirConfirmacion(
          'Enviar a Papelera', 
          `¿Estás seguro de enviar a papelera el expediente de ${paciente.nombres}?`, 
          'Desactivar', 
          'bg-red-600 hover:bg-red-700', 
          () => {
            this.pacienteService.eliminarLogico(paciente.idPaciente!).subscribe({
              next: () => this.cargarPacientes(),
              error: () => this.mostrarMensajeGlobal('Error al desactivar.', 'error')
            });
          }
        );
      } else {
        this.abrirConfirmacion(
          'Restaurar Expediente', 
          `¿Restaurar el expediente de ${paciente.nombres}?`, 
          'Restaurar', 
          'bg-green-600 hover:bg-green-700', 
          () => {
            this.pacienteService.reactivar(paciente.idPaciente!).subscribe({
              next: () => this.cargarPacientes(),
              error: () => this.mostrarMensajeGlobal('Error al restaurar.', 'error')
            });
          }
        );
      }
    }
  }

  private resetForm(): Paciente {
    return {
      tipoDocumento: 'DNI', dni: '', nombres: '', apellidoPaterno: '',
      apellidoMaterno: '', fechaNacimiento: '', sexo: 'MASCULINO',
      direccion: '', telefono: '', correo: '', estado: 'ACTIVO'
    };
  }
}