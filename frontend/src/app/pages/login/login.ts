import { Component, ChangeDetectorRef } from '@angular/core';
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
  mantenerSesion: boolean = false;

  // Manejo de estados de la UI
  errorMsg: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  onLogin(event: Event): void {
    event.preventDefault(); 

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

    // Enviamos el estado del checkbox al servicio
    this.authService.login(credentials, this.mantenerSesion).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => { 
        this.loading = false; 

        // ¡MAGIA! Ahora imprimimos exactamente el mensaje que nos envía Java (Bloqueo o Intentos restantes)
        if (err.error && typeof err.error === 'string') {
          this.errorMsg = err.error;
        } else if (err.status === 401 || err.status === 404) {
          this.errorMsg = 'Usuario o contraseña incorrectos.';
        } else {
          this.errorMsg = 'Hubo un problema al conectar con el servidor de la clínica.';
        }

        this.cdr.detectChanges(); 
      }
    });
  }
}