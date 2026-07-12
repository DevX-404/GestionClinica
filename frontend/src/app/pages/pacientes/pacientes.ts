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
  // Lista de datos original de la base de datos
  pacientes: Paciente[] = [];
  
  // --- VARIABLES PARA TAILADMIN DATATABLES ---
  searchTerm: string = '';
  sortOrder: string = 'desc'; // 'desc' = Recién llegados, 'asc' = Antiguos
  pageSize: number = 5;
  currentPage: number = 1;

  // Control del Modal
  isModalOpen: boolean = false;
  isEditing: boolean = false;

  // Variables de validación estrictas
  dniInvalido: boolean = false;
  telefonoInvalido: boolean = false;

  // Objeto espejo para el formulario
  pacienteForm: Paciente = this.resetForm();

  errorMsg: string = '';
  successMsg: string = '';

  isLoading: boolean = false; 
  globalMsg: string = ''; 
  globalMsgType: 'success' | 'error' = 'success';

  constructor(private pacienteService: PacienteService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.isLoading = true; 
    this.cdr.detectChanges();

    this.pacienteService.listarTodos().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.isLoading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al traer pacientes:', err);
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al conectar con el servidor. Intenta de nuevo.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- LÓGICA DE FILTRADO, ORDENAMIENTO Y PAGINACIÓN TAILADMIN ---
  get listaFiltrada(): Paciente[] {
    let result = this.pacientes;

    // 1. Buscador
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.nombres.toLowerCase().includes(term) ||
        p.apellidoPaterno.toLowerCase().includes(term) ||
        p.dni.includes(term)
      );
    }

    // 2. Ordenar Antiguos vs Recientes
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
  // -------------------------------------------------------------

  openModal(paciente?: Paciente): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.dniInvalido = false;
    this.telefonoInvalido = false;
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

  // --- LÓGICA DE VALIDACIÓN EN TIEMPO REAL ---
  cambioTipoDocumento(): void {
    if (!this.isEditing) {
      this.pacienteForm.dni = '';
      this.dniInvalido = false;
    }
  }

  validarDocumento(event: any): void {
    const input = event.target;
    if (this.pacienteForm.tipoDocumento === 'DNI') {
      let valor = input.value.replace(/[^0-9]/g, ''); // Fuerza solo números
      if (valor.length > 8) valor = valor.substring(0, 8); // Bloquea si intentan pegar más de 8
      input.value = valor;
      this.pacienteForm.dni = valor;
      this.dniInvalido = valor.length > 0 && valor.length < 8; // Pinta rojo si no llega a 8
    } else {
      this.dniInvalido = false;
    }
  }

  validarTelefono(event: any): void {
    const input = event.target;
    let valor = input.value.replace(/[^0-9]/g, ''); // Fuerza solo números
    if (valor.length > 9) valor = valor.substring(0, 9); // Bloquea si intentan pegar más de 9
    input.value = valor;
    this.pacienteForm.telefono = valor;
    this.telefonoInvalido = valor.length > 0 && valor.length < 9; // Pinta rojo si no llega a 9
  }
  // ---------------------------------------------

  guardarPaciente(): void {
    // Escudo final antes de enviar al servidor
    if (this.pacienteForm.tipoDocumento === 'DNI' && (!this.pacienteForm.dni || this.pacienteForm.dni.length !== 8)) {
      this.dniInvalido = true;
      this.errorMsg = 'Revisa los campos en rojo. El DNI debe tener exactamente 8 números.';
      return;
    }
    if (!this.pacienteForm.telefono || this.pacienteForm.telefono.length !== 9) {
      this.telefonoInvalido = true;
      this.errorMsg = 'Revisa los campos en rojo. El teléfono debe tener exactamente 9 números.';
      return;
    }

    if (this.isEditing && this.pacienteForm.idPaciente) {
      this.pacienteService.actualizar(this.pacienteForm.idPaciente, this.pacienteForm).subscribe({
        next: () => {
          this.closeModal(); 
          this.mostrarMensajeGlobal('¡Paciente actualizado con éxito!', 'success');
          this.cargarPacientes();
        },
        error: (err) => {
          this.errorMsg = 'No se pudo actualizar al paciente.';
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
          // CORRECCIÓN PARA DIFERENCIAR ERRORES (FECHA VS DNI)
          if (err.status === 400 && err.error && err.error.message) {
            this.errorMsg = err.error.message;
          } else if (err.status === 400) {
            this.errorMsg = 'Hay un error en los datos (revisa que la fecha tenga el formato correcto).';
          } else {
            this.errorMsg = 'Error al guardar la ficha del paciente.';
          }
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