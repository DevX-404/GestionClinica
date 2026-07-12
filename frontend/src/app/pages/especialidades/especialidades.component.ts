import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  // DATOS
  especialidades: Especialidad[] = [];
  especialidadesFiltradas: Especialidad[] = [];
  especialidadesPaginadas: Especialidad[] = []; // NUEVO: Para la paginación de la tabla
  
  // CONTROLES DE LA TABLA
  searchTerm: string = '';
  itemsPorPagina: number = 5;
  paginaActual: number = 1;
  mostrandoInactivos: boolean = false;

  isLoading: boolean = false;

  // Alertas fuera del modal
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Control del Modal
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  errorMsg: string = '';
  isSaving: boolean = false;

  especialidadForm: Especialidad = this.resetForm();

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  cargarEspecialidades(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.especialidadService.listarTodas().subscribe({
      next: (data) => {
        this.especialidades = data;
        this.filtrar(); // Así respeta si estamos viendo activos o inactivos y actualiza tabla
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('No se pudo conectar con el servidor de especialidades.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- FILTRADO CORREGIDO CON PAGINACIÓN ---
  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const estadoFiltro = this.mostrandoInactivos ? 'INACTIVO' : 'ACTIVO';
    
    this.especialidadesFiltradas = this.especialidades.filter(e => {
      // 1. Aseguramos que el estado coincida (limpiando espacios y forzando mayúsculas)
      const estadoBD = e.estado ? e.estado.trim().toUpperCase() : 'ACTIVO';
      const coincideEstado = estadoBD === estadoFiltro;

      // 2. Aseguramos que el texto de búsqueda coincida
      const coincideTexto = e.nombre.toLowerCase().includes(term) || 
                            (e.descripcion && e.descripcion.toLowerCase().includes(term));
      
      // 3. Solo devolvemos la especialidad si cumple AMBAS condiciones
      return coincideEstado && coincideTexto;
    });

    // Regresamos a la primera página tras buscar o cambiar de vista
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  toggleVista(): void {
    this.mostrandoInactivos = !this.mostrandoInactivos;
    this.filtrar(); // Volvemos a filtrar para actualizar la tabla (esto recarga la paginación automáticamente)
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.especialidadesPaginadas = this.especialidadesFiltradas.slice(inicio, fin);
  }

  cambiarPaginacion(): void {
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  paginaSiguiente(): void {
    if ((this.paginaActual * this.itemsPorPagina) < this.especialidadesFiltradas.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.especialidadesFiltradas.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.especialidadesFiltradas.length ? this.especialidadesFiltradas.length : fin;
  }
  // --- FIN LÓGICA DE PAGINACIÓN ---

  restaurarEspecialidad(esp: Especialidad): void {
    if (confirm('¿Estás seguro de restaurar y volver a activar esta especialidad?')) {
      // Reutilizamos el método actualizar para cambiarle el estado a ACTIVO
      const espRestaurada = { ...esp, estado: 'ACTIVO' };
      
      this.especialidadService.actualizar(esp.idEspecialidad!, espRestaurada).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Especialidad restaurada y activa nuevamente.', 'success');
          this.cargarEspecialidades();
        },
        error: () => {
          this.mostrarMensajeGlobal('No se pudo restaurar la especialidad.', 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  openModal(especialidad?: Especialidad): void {
    this.errorMsg = '';
    this.isSaving = false; // Aseguramos que el spinner esté apagado al abrir el modal
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
    const faltaNombre = !this.especialidadForm.nombre || this.especialidadForm.nombre.trim() === '';
    const faltaPrecio = !this.especialidadForm.precioConsulta || this.especialidadForm.precioConsulta <= 0;

    // 1. Si AMBOS están vacíos
    if (faltaNombre && faltaPrecio) {
      this.errorMsg = 'Por favor, completa todos los campos obligatorios (*).';
      this.cdr.detectChanges();
      return;
    }
    
    // 2. Si SOLO falta el nombre
    if (faltaNombre) {
      this.errorMsg = 'El nombre de la especialidad es obligatorio.';
      this.cdr.detectChanges();
      return;
    }

    // 3. Si SOLO falta el precio
    if (faltaPrecio) {
      this.errorMsg = 'El precio de la consulta es obligatorio y debe ser mayor a 0.';
      this.cdr.detectChanges();
      return;
    }

    // Si pasa todas las validaciones, limpiamos el mensaje y continuamos
    this.errorMsg = '';
    // --- PRENDEMOS EL SPINNER ---
    this.isSaving = true;
    this.cdr.detectChanges();
    
    if (this.isEditing && this.especialidadForm.idEspecialidad) {
      this.especialidadService.actualizar(this.especialidadForm.idEspecialidad, this.especialidadForm).subscribe({
        next: () => {
          this.finalizarGuardado('Especialidad actualizada correctamente.');
        },
        error: (err) => {
          this.isSaving = false; // APAGAMOS EL SPINNER
          if (err.status === 200 || err.status === 201) {
            this.finalizarGuardado('Especialidad actualizada correctamente.');
          } else {
          this.errorMsg = err.error?.message || 'Error al actualizar la especialidad.';
          this.cdr.detectChanges();
          }
        }
      });
    } else {
      this.especialidadService.registrar(this.especialidadForm).subscribe({
       next: () => {
          this.finalizarGuardado('Nueva especialidad registrada con éxito.');
        },
        error: (err) => {
          this.isSaving = false;
          // Detección del "Falso Error" de Angular
          if (err.status === 200 || err.status === 201) {
            this.finalizarGuardado('Nueva especialidad registrada con éxito.');
          } else {
            this.errorMsg = err.error?.message || 'El nombre de la especialidad ya se encuentra registrado.';
            this.cdr.detectChanges();
          }
        }         
      });
    }
  }

  // --- FUNCIÓN DE APOYO ---
  private finalizarGuardado(mensaje: string): void {
    this.isSaving = false;
    this.closeModal();
    this.mostrarMensajeGlobal(mensaje, 'success');
    this.cargarEspecialidades();
    this.cdr.detectChanges(); // Obliga a la pantalla a refrescarse
  }

  eliminarEspecialidad(id: number): void {
    if (confirm('¿Estás seguro de deshabilitar esta especialidad?')) {
      this.especialidadService.eliminarLogico(id).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Especialidad dada de baja correctamente.', 'success');
          this.cargarEspecialidades();
        },
        error: () => {
          this.mostrarMensajeGlobal('No se pudo eliminar la especialidad.', 'error');
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

  private resetForm(): Especialidad {
    return { nombre: '', descripcion: '', estado: 'ACTIVO', precioConsulta: undefined };
  }
}