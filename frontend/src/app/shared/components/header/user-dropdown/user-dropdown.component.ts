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
    const sessionNombreReal = localStorage.getItem('nombreReal');
    const sessionUser = localStorage.getItem('username');
    const sessionRol = localStorage.getItem('rol');

    const nombreParaMostrar = sessionNombreReal || sessionUser || 'Usuario';
    this.nombreUsuario = nombreParaMostrar;
    this.extraerDatosUsuario(nombreParaMostrar);
    
    if (sessionRol) {
      this.rolUsuario = sessionRol.toLowerCase();
    }
  }

  // Función para procesar el nombre dinámicamente
  extraerDatosUsuario(nombreCompleto: string): void {
    // Limpiamos caracteres raros por si usamos el username (Ej: luis_bances -> luis bances)
    const nombreLimpio = nombreCompleto.replace(/[._-]/g, ' ').trim();
    const partes = nombreLimpio.split(' ').filter(p => p.length > 0);
    
    if (partes.length > 0) {
      this.primerNombre = partes[0];
    }

    if (partes.length > 1) {
      // Tiene nombre y apellido (Ej: Luis Bances -> LB)
      this.iniciales = (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    } else if (partes.length === 1) {
      // Es una sola palabra (Ej: Admin -> AD)
      this.iniciales = partes[0].substring(0, 2).toUpperCase(); 
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