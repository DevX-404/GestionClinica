import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ← Obligatorio para leer inputs
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  // Variables espejo del HTML
  usernameTxt: string = '';
  passwordTxt: string = '';
  errorMsg: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(event: Event) {
    event.preventDefault();
    this.errorMsg = '';

    const payload = {
      username: this.usernameTxt,
      password: this.passwordTxt
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        // Guardado exitoso en LocalStorage gracias al tap del servicio
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg = 'Credenciales incorrectas. Inténtalo de nuevo, causha.';
        console.error(err);
      }
    });
  }
}