import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dropdown.component.html'
})

export class UserDropdownComponent implements OnInit {
  // Variables para la vista
  nombreUsuario: string = 'Usuario';
  primerNombre: string = 'Usuario';
  iniciales: string = 'U';
  rolUsuario: string = 'Personal';
  isDropdownOpen: boolean = false; // Control del menú desplegable

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Jalamos los datos reales de la sesión
    const sessionUser = localStorage.getItem('username');
    const sessionRol = localStorage.getItem('rol');

    if (sessionUser) {
      this.nombreUsuario = sessionUser;
    }
    
    if (sessionRol) {
      // Formateamos el rol para que no se vea en mayúsculas secas (opcional)
      this.rolUsuario = sessionRol.toLowerCase();
    }
  }

  // Función para procesar el nombre dinámicamente
  extraerDatosUsuario(nombreCompleto: string): void {
    const partes = nombreCompleto.trim().split(' ');
    
    // Obtenemos el primer nombre para el saludo
    this.primerNombre = partes[0];

    // Lógica para las iniciales (Ej: Luis Bances -> LB)
    if (partes.length > 1) {
      this.iniciales = (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    } else {
      this.iniciales = partes[0].charAt(0).toUpperCase();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  cerrarSesion(): void {
    localStorage.clear(); // Limpiamos token, rol y usuario
    this.router.navigate(['/login']); // Patitas para la calle al login público
  }
}