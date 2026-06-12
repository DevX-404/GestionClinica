import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit {
  // Control del dropdown
  isOpen = false;
  notifying = true;

  // Notificaciones por rol
  rol: string = '';
  notificaciones: any[] = [];

  ngOnInit(): void {
    this.rol = localStorage.getItem('rol') || '';
    this.cargarNotificacionesPorRol();

    this.notifying = this.notificaciones.length > 0;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.notifying = false;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  cargarNotificacionesPorRol(): void {
    if (this.rol === 'MEDICO') {
      this.notificaciones = [
        {
          titulo: 'Cita en 30 min',
          mensaje: 'Paciente Juan Pérez'
        },
        {
          titulo: 'Cita Cancelada',
          mensaje: 'Se liberó tu horario de las 10:00 AM'
        }
      ];
    } else if (this.rol === 'ADMINISTRADOR') {
      this.notificaciones = [
        {
          titulo: 'Alerta de Pagos',
          mensaje: '3 pagos pendientes hoy'
        },
        {
          titulo: 'Nuevo Médico',
          mensaje: 'Aprobar cuenta del Dr. Salazar'
        }
      ];
    } else if (this.rol === 'RECEPCIONISTA') {
      this.notificaciones = [
        {
          titulo: 'Nuevo Paciente',
          mensaje: 'Ficha creada con éxito'
        }
      ];
    }
  }
}