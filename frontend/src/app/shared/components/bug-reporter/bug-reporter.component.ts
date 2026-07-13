import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidenciaService } from '../../services/incidencia.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-bug-reporter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bug-reporter.component.html'
})
export class BugReporterComponent implements OnInit {
  private incidenciaService = inject(IncidenciaService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isOpen: boolean = false;
  isSubmitting: boolean = false;
  successMsg: string = '';
  errorMsg: string = '';

  idUsuarioActual: number | null = null;
  evidenciasBase64: string[] = [];

  incidenciaForm = {
    titulo: '',
    descripcion: '',
    tipo: 'ERROR_SISTEMA',
    nivelGravedad: 'MEDIA'
  };

  ngOnInit(): void {
    // Al cargar, buscamos el ID del usuario en silencio para tenerlo listo
    const username = localStorage.getItem('username');
    if (username) {
      this.usuarioService.obtenerPerfil(username).subscribe({
        next: (user: any) => this.idUsuarioActual = user.idUsuario
      });
    }
  }

  toggleModal(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.resetForm();
  }

  cargarEvidencia(event: any): void {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.evidenciasBase64.push(e.target.result);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removerEvidencia(index: number): void {
    this.evidenciasBase64.splice(index, 1);
  }

  enviarReporte(): void {
    if (!this.idUsuarioActual) {
      this.errorMsg = 'Sistema: No se pudo identificar tu usuario para el reporte.'; return;
    }
    if (!this.incidenciaForm.titulo.trim() || !this.incidenciaForm.descripcion.trim()) {
      this.errorMsg = 'El título y la descripción son obligatorios.'; return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const payload = {
      ...this.incidenciaForm,
      urlFalla: this.router.url,
      evidenciasJson: JSON.stringify(this.evidenciasBase64)
    };

    this.incidenciaService.registrar(this.idUsuarioActual, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMsg = '¡Incidencia enviada al equipo de TI con éxito!';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.isOpen = false; 
          this.resetForm(); 
          this.cdr.detectChanges(); 
        }, 2000);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMsg = 'Error de red al enviar el reporte.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.incidenciaForm = { titulo: '', descripcion: '', tipo: 'ERROR_SISTEMA', nivelGravedad: 'MEDIA' };
    this.evidenciasBase64 = [];
    this.successMsg = '';
    this.errorMsg = '';
  }
}