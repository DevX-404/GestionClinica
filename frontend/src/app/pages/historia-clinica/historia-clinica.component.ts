import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoriaClinicaService } from '../../shared/services/historia-clinica.service';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historia-clinica.component.html'
})
export class HistoriaClinicaComponent implements OnInit {
  
  private historiaService = inject(HistoriaClinicaService);
  private cdr = inject(ChangeDetectorRef);

  expedientes: any[] = [];
  expedientesFiltrados: any[] = [];
  searchTerm: string = '';
  
  isLoading = false;
  isModalOpen = false;
  expedienteSeleccionado: any = null;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    
    // LLAMADA REAL A TU BASE DE DATOS
    this.historiaService.obtenerTodosLosExpedientes().subscribe({
      next: (data: any[]) => {
        this.expedientes = data;
        this.expedientesFiltrados = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        console.error("Error al cargar las Historias Clínicas");
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buscar() {
    const term = this.searchTerm.toLowerCase();
    this.expedientesFiltrados = this.expedientes.filter(e => {
      const nombre = (e.nombreCompletoPaciente || e.paciente?.nombres || '').toLowerCase();
      const dni = e.paciente?.dni || e.dniPaciente || '';
      const id = e.idHistoriaClinica ? e.idHistoriaClinica.toString() : '';
      
      return nombre.includes(term) || dni.includes(term) || id.includes(term);
    });
  }

  verHistorial(exp: any) {
    this.expedienteSeleccionado = exp;
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.expedienteSeleccionado = null;
  }

  imprimirHistoria() {
    alert('¡Listo para generar el PDF de la Historia Clínica!');
  }
  parseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return [{ nombre: 'Diagnóstico', descripcion: jsonString }];
  }
}

parseTratamiento(tratamiento: string) {
  try {
    const obj = JSON.parse(tratamiento);
    return obj.descripcion || tratamiento; // Si es JSON, saca la descripción; si no, muestra el texto.
  } catch (e) {
    return tratamiento;
  }
}
}