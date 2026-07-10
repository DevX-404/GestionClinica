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
    // Clonamos el expediente para no alterar los datos en crudo de la tabla
    const expedienteClonado = JSON.parse(JSON.stringify(exp));
    
    // Parseamos las atenciones médicas para mostrarlas bonito en el HTML
    if (expedienteClonado.consultasMedicas) {
      expedienteClonado.consultasMedicas = expedienteClonado.consultasMedicas.map((c: any) => {
        
        // 1. Separar síntomas (Vienen como "Gripe, Tos" -> ['Gripe', 'Tos'])
        const sintomasTags = c.sintomas ? c.sintomas.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];
        
        // 2. Parsear el Diagnóstico (CIE-10 JSON a Array)
        let diagnosticosParsed = [];
        try { 
          diagnosticosParsed = JSON.parse(c.diagnosticoGeneral); 
          if (!Array.isArray(diagnosticosParsed)) diagnosticosParsed = [];
        } catch(e) { 
          diagnosticosParsed = c.diagnosticoGeneral ? [{nombre: 'CIE', descripcion: c.diagnosticoGeneral}] : []; 
        }

        // 3. Parsear el Tratamiento (JSON a Objeto)
        let tratamientoParsed = {};
        try { 
          tratamientoParsed = JSON.parse(c.tratamiento); 
        } catch(e) { 
          tratamientoParsed = { descripcion: c.tratamiento || 'Sin indicaciones registradas' }; 
        }

        return { ...c, sintomasTags, diagnosticosParsed, tratamientoParsed };
      });
    }

    this.expedienteSeleccionado = expedienteClonado;
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

  // --- GETTERS PARA DISEÑO DE ALERGIAS Y ANTECEDENTES ---
  get alergiasFormateadas(): { fecha: string; detalle: string }[] {
    const texto = this.expedienteSeleccionado?.alergias;
    if (!texto || texto.trim() === '' || texto.includes('aún no registra') || texto === 'Ninguna conocida.') return [];
    return texto.split('\n').map((linea: string) => {
      const match = linea.match(/^\[Agregado el ([^\]]+)\]:\s*(.*)$/);
      if (match) return { fecha: match[1], detalle: match[2] };
      return { fecha: '', detalle: linea };
    }).filter((item: any) => item.detalle.trim() !== '');
  }

  get antecedentesFormateadas(): { fecha: string; detalle: string }[] {
    const texto = this.expedienteSeleccionado?.antecedentes;
    if (!texto || texto.trim() === '' || texto.includes('aún no registra') || texto === 'Ninguno registrado.') return [];
    return texto.split('\n').map((linea: string) => {
      const match = linea.match(/^\[Agregado el ([^\]]+)\]:\s*(.*)$/);
      if (match) return { fecha: match[1], detalle: match[2] };
      return { fecha: '', detalle: linea };
    }).filter((item: any) => item.detalle.trim() !== '');
  }
}