import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../shared/services/usuario.service';
import { Usuario } from '../../shared/models/usuario.model';

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguridad.component.html'
})
export class SeguridadComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private cdr = inject(ChangeDetectorRef);

  // DATOS
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuariosPaginados: Usuario[] = []; 
  
  // CONTROLES DE LA TABLA
  searchTerm: string = '';
  itemsPorPagina: number = 5;
  paginaActual: number = 1;
  isLoading: boolean = false;

  // Alertas
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' = 'success';

  // Modal Reset Password
  isPasswordModalOpen: boolean = false;
  usuarioSeleccionado?: Usuario;
  nuevaPassword: string = '';
  errorPwdMsg: string = '';

  // Modal CRUD Usuarios
  isUserModalOpen: boolean = false;
  isEditMode: boolean = false;
  bloquearNombreEnEdicion: boolean = false;
  usuarioForm: any = { nombreCompleto: '', username: '', email: '', password: '', rol: 'RECEPCIONISTA', modulosAcceso: [] };

  modulosDisponibles = [
    'Dashboard', 'Agenda Médica', 'Pacientes', 'Citas Médicas', 'Historia Clínica', 
    'Recetas Médicas', 'Personal Médico', 'Pagos y Facturación', 'Reportes Globales', 
    'Seguridad y Usuarios', 'Auditoría del Sistema'
  ];

  // CONFIRMACIÓN ELEGANTE
  isConfirmModalOpen: boolean = false;
  confirmData: any = { titulo: '', mensaje: '', txtBtn: '', colorBtn: '', accion: null, accionCancelar: null };

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    // El setTimeout engaña a Angular para que no lance NG0100 al mostrar el spinner
    setTimeout(() => {
      this.isLoading = true;
      this.cdr.markForCheck();
    });

    this.usuarioService.listarTodos().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filtrar(); 
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la lista de usuarios.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      this.usuariosFiltrados = this.usuarios.filter(u => 
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rol.toLowerCase().includes(term) ||
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(term))
      );
    }
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.usuariosPaginados = this.usuariosFiltrados.slice(inicio, fin);
  }

  cambiarPaginacion(): void { this.paginaActual = 1; this.actualizarTabla(); }
  paginaAnterior(): void { if (this.paginaActual > 1) { this.paginaActual--; this.actualizarTabla(); } }
  paginaSiguiente(): void { if ((this.paginaActual * this.itemsPorPagina) < this.usuariosFiltrados.length) { this.paginaActual++; this.actualizarTabla(); } }
  calcularRangoInicio(): number { return this.usuariosFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1; }
  calcularRangoFin(): number { const fin = this.paginaActual * this.itemsPorPagina; return fin > this.usuariosFiltrados.length ? this.usuariosFiltrados.length : fin; }

  // --- CRUD Modal Lógica ---
  openUserModal(usuario?: any): void {
    if (usuario) {
      this.isEditMode = true;
      
      // PARCHE ANTIFALLOS NG0100: Preparamos y limpiamos la data ANTES de asignarla al form
      let modulosParseados: string[] = [];
      if (usuario.modulosAcceso) {
        if (typeof usuario.modulosAcceso === 'string') {
          modulosParseados = usuario.modulosAcceso
            .replace(/[\[\]]/g, '')
            .split(',')
            .map((m: string) => m.trim());
        } else if (Array.isArray(usuario.modulosAcceso)) {
          modulosParseados = [...usuario.modulosAcceso];
        }
      }

      this.usuarioForm = { 
        ...usuario,
        modulosAcceso: modulosParseados // Asignamos un Array puro y duro
      };
      
      this.bloquearNombreEnEdicion = !!this.usuarioForm.nombreCompleto && this.usuarioForm.nombreCompleto.trim().length > 0;
      
    } else {
      this.isEditMode = false;
      this.bloquearNombreEnEdicion = false;
      this.usuarioForm = { nombreCompleto: '', username: '', email: '', password: '', rol: 'RECEPCIONISTA', modulosAcceso: [] };
    }
    
    // Abrimos el modal al final de la función para que Angular dibuje el HTML con la data ya limpia
    this.isUserModalOpen = true;
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
  }

  toggleModulo(modulo: string): void {
    const index = this.usuarioForm.modulosAcceso.indexOf(modulo);
    if (index === -1) {
      this.usuarioForm.modulosAcceso.push(modulo);
    } else {
      this.usuarioForm.modulosAcceso.splice(index, 1);
    }
  }

  guardarUsuario(): void {
    if (this.isEditMode) {
      this.usuarioService.actualizar(this.usuarioForm.idUsuario, this.usuarioForm).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Usuario actualizado correctamente.', 'success');
          this.cargarUsuarios();
          this.closeUserModal();
        },
        error: () => this.mostrarMensajeGlobal('Error al actualizar usuario.', 'error')
      });
    } else {
      this.usuarioService.crear(this.usuarioForm).subscribe({
        next: () => {
          this.mostrarMensajeGlobal('Usuario creado correctamente.', 'success');
          this.cargarUsuarios();
          this.closeUserModal();
        },
        error: () => this.mostrarMensajeGlobal('Error al crear usuario.', 'error')
      });
    }
  }

  toggleEstado(usuario: Usuario): void {
    const accion = usuario.activo ? 'deshabilitar' : 'habilitar';
    const colorBtn = usuario.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
    
    this.abrirConfirmacion(
      'Confirmar Acción',
      `¿Estás seguro de ${accion} el acceso para el usuario ${usuario.username}?`,
      'Sí, Proceder',
      colorBtn,
      () => {
        this.usuarioService.cambiarEstado(usuario.idUsuario).subscribe({
          next: () => {
            this.mostrarMensajeGlobal(`Estado actualizado correctamente.`, 'success');
            this.cargarUsuarios();
          },
          error: () => this.mostrarMensajeGlobal('No se pudo cambiar el estado.', 'error')
        });
      }
    );
  }

  cambiarRolLocal(usuario: Usuario, event: any): void {
    const nuevoRol = event.target.value;
    
    this.abrirConfirmacion(
      'Modificar Privilegios',
      `¿Cambiar el rol de ${usuario.username} a ${nuevoRol}? Esto alterará sus accesos.`,
      'Cambiar Rol',
      'bg-brand-600 hover:bg-brand-700',
      () => {
        this.usuarioService.cambiarRol(usuario.idUsuario, nuevoRol).subscribe({
          next: () => this.mostrarMensajeGlobal('Rol actualizado.', 'success'),
          error: () => {
            this.mostrarMensajeGlobal('Error al cambiar rol.', 'error');
            this.cargarUsuarios(); 
          }
        });
      },
      () => this.cargarUsuarios() // Revertir si cancela
    );
  }

  // --- Reset Password ---
  openPasswordModal(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.nuevaPassword = '';
    this.errorPwdMsg = '';
    this.isPasswordModalOpen = true;
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen = false;
    this.usuarioSeleccionado = undefined;
  }

  guardarNuevaPassword(): void {
    if (this.nuevaPassword.length < 6) {
      this.errorPwdMsg = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (this.usuarioSeleccionado) {
      this.usuarioService.restablecerPassword(this.usuarioSeleccionado.idUsuario, this.nuevaPassword).subscribe({
        next: () => {
          this.mostrarMensajeGlobal(`Contraseña de ${this.usuarioSeleccionado?.username} restablecida con éxito.`, 'success');
          this.closePasswordModal();
        },
        error: () => {
          this.errorPwdMsg = 'No se pudo restablecer la contraseña en el servidor.';
        }
      });
    }
  }

  // --- CONFIRMACIÓN ELEGANTE ---
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

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.markForCheck();
    }, 4000);
  }
}