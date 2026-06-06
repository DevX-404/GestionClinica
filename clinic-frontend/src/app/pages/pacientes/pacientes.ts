import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../shared/services/paciente.service';
import { Paciente } from '../../shared/models/paciente.model';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacientes.html'
})
export class Pacientes implements OnInit {
  listaPacientes: Paciente[] = [];

  constructor(private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listarTodos().subscribe({
      next: (data) => {
        this.listaPacientes = data;
      },
      error: (err) => {
        console.error('Error al conectar con la API de Spring Boot:', err);
      }
    });
  }
}