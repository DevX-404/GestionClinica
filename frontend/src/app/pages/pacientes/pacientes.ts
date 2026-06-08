import { Component, OnInit } from '@angular/core';
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
  // Listas de datos
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  
  // Filtro de búsqueda
  filtroBusqueda: string = '';

  // Control del Modal
  isModalOpen: boolean = false;
  isEditing: boolean = false;

  // Objeto espejo para el formulario
  pacienteForm: Paciente = this.resetForm();

  errorMsg: string = '';
  successMsg: string = '';

  isLoading: boolean = false; // <-- Control de carga
  globalMsg: string = ''; // <-- Mensaje para la vista principal
  globalMsgType: 'success' | 'error' = 'success';

  constructor(private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.isLoading = true; // Inicia la carga
    this.pacienteService.listarTodos().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.pacientesFiltrados = data;
        this.isLoading = false; // Termina la carga
      },
      error: (err) => {
        console.error('Error al traer pacientes:', err);
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al conectar con el servidor. Intenta de nuevo.', 'error');
      }
    });
  }

  filtrar(): void {
    const busqueda = this.filtroBusqueda.toLowerCase().trim();
    if (!busqueda) {
      this.pacientesFiltrados = this.pacientes;
    } else {
      this.pacientesFiltrados = this.pacientes.filter(p => 
        p.nombres.toLowerCase().includes(busqueda) ||
        p.apellidoPaterno.toLowerCase().includes(busqueda) ||
        p.dni.includes(busqueda)
      );
    }
  }

  openModal(paciente?: Paciente): void {
    this.errorMsg = '';
    this.successMsg = '';
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

  guardarPaciente(): void {
    if (this.isEditing && this.pacienteForm.idPaciente) {
      this.pacienteService.actualizar(this.pacienteForm.idPaciente, this.pacienteForm).subscribe({
        next: () => {
          this.closeModal(); // Cierra al instante
          this.mostrarMensajeGlobal('¡Paciente actualizado con éxito!', 'success');
          this.cargarPacientes();
        },
        error: (err) => this.errorMsg = 'No se pudo actualizar al paciente.' // El error sí se queda en el modal
      });
    } else {
      this.pacienteService.registrar(this.pacienteForm).subscribe({
        next: () => {
          this.closeModal(); // Cierra al instante
          this.mostrarMensajeGlobal('¡Paciente registrado e Historia Clínica inicializada!', 'success');
          this.cargarPacientes();
        },
        error: (err) => {
          if (err.status === 400) {
            this.errorMsg = 'El DNI ingresado ya se encuentra registrado.';
          } else {
            this.errorMsg = 'Error al guardar la ficha del paciente.';
          }
        }
      });
    }
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000); // Desaparece solo a los 4 segundos
  }

  cambiarEstado(paciente: Paciente): void {
    if (paciente.idPaciente) {
      this.pacienteService.eliminarLogico(paciente.idPaciente).subscribe({
        next: () => this.cargarPacientes(),
        error: (err) => console.error('Error al cambiar estado:', err)
      });
    }
  }

  private resetForm(): Paciente {
    return {
      tipoDocumento: 'DNI',
      dni: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      sexo: 'MASCULINO',
      direccion: '',
      telefono: '',
      correo: '',
      estado: 'ACTIVO'
    };
  }
}