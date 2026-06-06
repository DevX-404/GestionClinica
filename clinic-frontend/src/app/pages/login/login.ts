import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.html'
})
export class Login {

  constructor(private router: Router) {}

  // Método temporal para simular el ingreso al sistema
  onLogin(event: Event) {
    event.preventDefault();
    // Redirige al panel principal
    this.router.navigate(['/dashboard']);
  }
}