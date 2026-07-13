import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { UsuarioService } from '../../../services/usuario.service';
import { NotificacionService } from '../../../services/notificacion.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit {
  // Control del dropdown
  isOpen = false;
  notifying = false;

  notificaciones: any[] = [];

  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);

  ngOnInit(): void {
    this.cargarDatosReales();
  }

  cargarDatosReales(): void {
    const username = localStorage.getItem('username');
    if (username) {
      // 1. Buscamos la identidad de quien inició sesión
      this.usuarioService.obtenerPerfil(username).subscribe({
        next: (usuario: any) => {
          if (usuario && usuario.idUsuario) {
            // 2. Traemos sus notificaciones reales
            this.notificacionService.listarMisNotificaciones(usuario.idUsuario).subscribe({
              next: (data) => {
                this.notificaciones = data;
                // Si existe al menos 1 no leída, prende la alarma naranja
                this.notifying = this.notificaciones.some(n => !n.leido);
              }
            });
          }
        }
      });
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  // Se activa cuando el usuario hace clic en una notificación específica
  marcarLeida(n: any): void {
    if (!n.leido) {
      this.notificacionService.marcarComoLeida(n.idNotificacion).subscribe({
        next: () => {
          n.leido = true; // Se pinta de gris (leída)
          this.notifying = this.notificaciones.some(notif => !notif.leido); // Recalcula la alarma
        }
      });
    }
    this.closeDropdown(); // Opcional: cierra el dropdown tras hacer clic
  }
}