import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ← REQUISITO: Para usar [(ngModel)]
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  // Propiedades para capturar las credenciales
  usernameTxt: string = '';
  passwordTxt: string = '';

  // Manejo de estados de la UI
  errorMsg: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  onLogin(event: Event): void {
    event.preventDefault(); // Evitar que la página se recargue por defecto

    // Validación básica en el cliente
    if (!this.usernameTxt || !this.passwordTxt) {
      this.errorMsg = 'Por favor, completa todos los campos, causha.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const credentials = {
      username: this.usernameTxt,
      password: this.passwordTxt
    };

    // Consumir el endpoint de Spring Boot
    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => { // ← CORREGIDO: Usar => en vez de ->
        this.loading = false; // Ahora sí se ejecutará y apagará el spinner

        if (err.status === 401 || err.status === 404) {
          this.errorMsg = 'Usuario o contraseña incorrectos.';
        } else {
          this.errorMsg = 'Hubo un problema al conectar con el servidor de la clínica.';
        }
        console.error('Error de autenticación:', err);
      }
    });
  }
}