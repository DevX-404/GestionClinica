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

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  cerrarSesion(): void {
    localStorage.clear(); // Limpiamos token, rol y usuario
    this.router.navigate(['/login']); // Patitas para la calle al login público
  }
}