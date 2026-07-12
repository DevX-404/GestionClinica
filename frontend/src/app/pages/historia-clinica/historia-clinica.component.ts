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
  expedientesPaginados: any[] = []; // NUEVO: Para la paginación de la tabla
  
  // Controles de Paginación y Búsqueda
  searchTerm: string = '';
  itemsPorPagina: number = 5;
  paginaActual: number = 1;
  
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
        
        // Iniciar la tabla
        this.actualizarTabla();

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

  // --- BUSCADOR CORREGIDO ---
  buscar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.expedientesFiltrados = [...this.expedientes];
    } else {
      // Las variables coinciden ahora con las que se muestran en el HTML
      this.expedientesFiltrados = this.expedientes.filter(e => {
        const nombre = (e.nombreCompletoPaciente || '').toLowerCase();
        const dni = (e.dni || '').toLowerCase();
        const expediente = (e.numeroExpediente || '').toLowerCase();
        
        return nombre.includes(term) || dni.includes(term) || expediente.includes(term);
      });
    }

    // Regresamos a la primera página tras buscar y actualizamos tabla
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  actualizarTabla(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + Number(this.itemsPorPagina);
    this.expedientesPaginados = this.expedientesFiltrados.slice(inicio, fin);
  }

  cambiarPaginacion(): void {
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  paginaSiguiente(): void {
    if ((this.paginaActual * this.itemsPorPagina) < this.expedientesFiltrados.length) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  calcularRangoInicio(): number {
    return this.expedientesFiltrados.length === 0 ? 0 : ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
  }

  calcularRangoFin(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.expedientesFiltrados.length ? this.expedientesFiltrados.length : fin;
  }
  // --- FIN LÓGICA DE PAGINACIÓN ---

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