import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicoService } from '../../shared/services/medico.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { Medico } from '../../shared/models/medico.model';
import { Especialidad } from '../../shared/models/especialidad.model';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicos.component.html'
})
export class MedicosComponent implements OnInit {
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);

  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  especialidades: Especialidad[] = [];
  
  searchTerm: string = '';
  isLoading: boolean = false;
  
  // Mensajes Globales
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Modal
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  errorMsg: string = '';

  // Formulario inicial
  medicoForm: Medico = this.resetForm();

  ngOnInit(): void {
    this.cargarEspecialidades();
    this.cargarMedicos();
  }

  cargarEspecialidades(): void {
    this.especialidadService.listarTodas().subscribe({
      next: (data) => this.especialidades = data,
      error: (err) => console.error('Error al cargar especialidades', err)
    });
  }

  cargarMedicos(): void {
    this.isLoading = true;
    this.medicoService.listarTodos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.medicosFiltrados = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la lista de médicos.', 'error');
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.medicosFiltrados = this.medicos.filter(m => 
      m.nombres.toLowerCase().includes(term) ||
      m.apellidoPaterno.toLowerCase().includes(term) ||
      m.codigoColegiatura.toLowerCase().includes(term)
    );
  }

  openModal(medico?: Medico): void {
    this.errorMsg = '';
    if (medico) {
      this.isEditing = true;
      this.medicoForm = { ...medico };
    } else {
      this.isEditing = false;
      this.medicoForm = this.resetForm();
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  guardarMedico(): void {
    if (!this.medicoForm.nombres || !this.medicoForm.codigoColegiatura || !this.medicoForm.correo || !this.medicoForm.idEspecialidad) {
      this.errorMsg = 'Por favor, completa los campos obligatorios.';
      return;
    }

    if (this.isEditing && this.medicoForm.idMedico) {
      this.medicoService.actualizar(this.medicoForm.idMedico, this.medicoForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico actualizado con éxito.', 'success');
          this.cargarMedicos();
        },
        error: (err) => this.errorMsg = 'Error al actualizar: ' + (err.error?.message || 'Revisa los datos.')
      });
    } else {
      this.medicoService.registrar(this.medicoForm).subscribe({
        next: () => {
          this.closeModal();
          this.mostrarMensajeGlobal('Médico registrado y cuenta de usuario creada.', 'success');
          this.cargarMedicos();
        },
        error: (err) => this.errorMsg = 'Error al registrar: ' + (err.error?.message || 'El correo o colegiatura ya existe.')
      });
    }
  }

  eliminarMedico(id: number): void {
    if (confirm('¿Estás seguro de dar de baja a este médico? Se deshabilitará su acceso al sistema.')) {
      this.medicoService.eliminar(id).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Médico dado de baja exitosamente.', 'success');
          this.cargarMedicos();
        },
        error: () => this.mostrarMensajeGlobal('No se pudo eliminar al médico.', 'error')
      });
    }
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    setTimeout(() => this.globalMsg = '', 4000);
  }

  private resetForm(): Medico {
    return {
      codigoColegiatura: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
      telefono: '', correo: '', estadoDisponibilidad: 'DISPONIBLE', idEspecialidad: 0
    };
  }
}