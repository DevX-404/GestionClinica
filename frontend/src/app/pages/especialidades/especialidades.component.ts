import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { Especialidad } from '../../shared/models/especialidad.model';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './especialidades.component.html'
})
export class EspecialidadesComponent implements OnInit {
  private especialidadService = inject(EspecialidadService);

  especialidades: Especialidad[] = [];
  especialidadesFiltradas: Especialidad[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;

  // Alertas fuera del modal
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Control del Modal
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  errorMsg: string = '';

  especialidadForm: Especialidad = this.resetForm();

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  cargarEspecialidades(): void {
    this.isLoading = true;
    this.especialidadService.listarTodas().subscribe({
      next: (data) => {
        this.especialidades = data;
        this.especialidadesFiltradas = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('No se pudo conectar con el servidor de especialidades.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.especialidadesFiltradas = this.especialidades.filter(e => 
      e.nombre.toLowerCase().includes(term) || 
      (e.descripcion && e.descripcion.toLowerCase().includes(term))
    );
  }

  openModal(especialidad?: Especialidad): void {
    this.errorMsg = '';
    if (especialidad) {
      this.isEditing = true;
      this.especialidadForm = { ...especialidad };
    } else {
      this.isEditing = false;
      this.especialidadForm = this.resetForm();
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  guardarEspecialidad(): void {
    if (!this.especialidadForm.nombre.trim()) {
      this.errorMsg = 'El nombre de la especialidad es obligatorio.';
      return;
    }

    if (this.isEditing && this.especialidadForm.idEspecialidad) {
      this.especialidadService.actualizar(this.especialidadForm.idEspecialidad, this.especialidadForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Especialidad actualizada correctamente.', 'success');
          this.cargarEspecialidades();
        },
        error: (err) => this.errorMsg = err.error?.message || 'Error al actualizar la especialidad.'
      });
    } else {
      this.especialidadService.registrar(this.especialidadForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Nueva especialidad registrada con éxito.', 'success');
          this.cargarEspecialidades();
        },
        error: (err) => this.errorMsg = err.error?.message || 'El nombre de la especialidad ya se encuentra registrado.'
      });
    }
  }

  eliminarEspecialidad(id: number): void {
    if (confirm('¿Estás seguro de deshabilitar esta especialidad?')) {
      this.especialidadService.eliminarLogico(id).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Especialidad dada de baja correctamente.', 'success');
          this.cargarEspecialidades();
        },
        error: () => this.mostrarMensajeGlobal('No se pudo eliminar la especialidad.', 'error')
      });
    }
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000);
  }

  private resetForm(): Especialidad {
    return { nombre: '', descripcion: '', estado: 'ACTIVO' };
  }
}