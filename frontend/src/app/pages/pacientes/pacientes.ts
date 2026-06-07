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

  constructor(private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listarTodos().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.pacientesFiltrados = data;
      },
      error: (err) => console.error('Error al traer pacientes:', err)
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
      // Actualizar paciente
      this.pacienteService.actualizar(this.pacienteForm.idPaciente, this.pacienteForm).subscribe({
        next: () => {
          this.successMsg = '¡Paciente actualizado con éxito!';
          this.cargarPacientes();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => this.errorMsg = 'No se pudo actualizar al paciente.'
      });
    } else {
      // Registrar nuevo paciente
      this.pacienteService.registrar(this.pacienteForm).subscribe({
        next: () => {
          this.successMsg = '¡Paciente registrado e Historia Clínica inicializada!';
          this.cargarPacientes();
          setTimeout(() => this.closeModal(), 1500);
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