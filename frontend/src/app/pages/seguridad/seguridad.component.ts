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

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchTerm: string = '';
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
  // --- AÑADIMOS UNA VARIABLE PARA SABER SI DEBEMOS BLOQUEAR EL NOMBRE ---
  bloquearNombreEnEdicion: boolean = false;
  usuarioForm: any = { username: '', email: '', password: '', rol: 'RECEPCIONISTA', modulosAcceso: [] };

  // Lista de módulos para los Checkboxes
  modulosDisponibles = [
    'Dashboard', 'Agenda Médica', 'Pacientes', 'Citas Médicas', 'Historia Clínica', 
    'Recetas Médicas', 'Personal Médico', 'Pagos y Facturación', 'Reportes Globales', 
    'Seguridad y Usuarios', 'Auditoría del Sistema'
  ];

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.usuarioService.listarTodos().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la lista de usuarios.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term) ||
      (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(term)) // Búsqueda extra por nombre
    );
  }

  // --- CRUD Modal Lógica ---
  openUserModal(usuario?: any): void {
    if (usuario) {
      this.isEditMode = true;
      this.usuarioForm = { ...usuario };
      if (!this.usuarioForm.modulosAcceso) this.usuarioForm.modulosAcceso = [];
      
      // LA LÓGICA DEL CANDADO: Si el usuario ya tiene nombre registrado, se bloquea la edición.
      // Si el nombre viene nulo, indefinido o en blanco, se permite editar (para corregir los viejos).
      this.bloquearNombreEnEdicion = !!this.usuarioForm.nombreCompleto && this.usuarioForm.nombreCompleto.trim().length > 0;
      
    } else {
      this.isEditMode = false;
      this.bloquearNombreEnEdicion = false; // Al crear uno nuevo, obviamente se puede escribir
      this.usuarioForm = { nombreCompleto: '', username: '', email: '', password: '', rol: 'RECEPCIONISTA', modulosAcceso: [] };
    }
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
    if (confirm(`¿Estás seguro de ${accion} el acceso para el usuario ${usuario.username}?`)) {
      this.usuarioService.cambiarEstado(usuario.idUsuario).subscribe({
        next: (userAcutalizado) => {
          this.mostrarMensajeGlobal(`Estado actualizado correctamente.`, 'success');
          // Actualizamos el objeto en la vista sin recargar todo
          const idx = this.usuariosFiltrados.findIndex(u => u.idUsuario === usuario.idUsuario);
          if (idx !== -1) this.usuariosFiltrados[idx].activo = userAcutalizado.activo;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mostrarMensajeGlobal('No se pudo cambiar el estado.', 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  cambiarRolLocal(usuario: Usuario, event: any): void {
    const nuevoRol = event.target.value;
    if (confirm(`¿Cambiar el rol de ${usuario.username} a ${nuevoRol}?`)) {
      this.usuarioService.cambiarRol(usuario.idUsuario, nuevoRol).subscribe({
        next: () => this.mostrarMensajeGlobal('Rol actualizado.', 'success'),
        error: () => {
          this.mostrarMensajeGlobal('Error al cambiar rol.', 'error');
          this.cargarUsuarios(); // Recargamos para deshacer el cambio visual
        }
      });
    } else {
      this.cargarUsuarios(); // Deshacer visual
    }
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
          this.closePasswordModal();
          this.mostrarMensajeGlobal(`Contraseña de ${this.usuarioSeleccionado?.username} restablecida con éxito.`, 'success');
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorPwdMsg = 'No se pudo restablecer la contraseña en el servidor.';
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
}