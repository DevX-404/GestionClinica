import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { CitaMedicaService } from '../../shared/services/cita-medica.service';

import { ConsultaMedicaService } from '../../shared/services/consulta-medica.service';

import { RecetaMedicaService } from '../../shared/services/receta-medica.service';

import { RecetaMedicaDTO, DetalleRecetaDTO } from '../../shared/models/receta-medica.model';



@Component({

  selector: 'app-agenda',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './agenda.component.html'

})

export class AgendaComponent implements OnInit {

  private citaService = inject(CitaMedicaService);

  private consultaService = inject(ConsultaMedicaService);

  private recetaService = inject(RecetaMedicaService);

  private cdr = inject(ChangeDetectorRef);



  citasDelDia: any[] = [];

  citaSeleccionada: any = null;

  consultaCreadaId: number | null = null;

 

  // Control de navegación

  vistaActual: 'AGENDA' | 'ATENCION' = 'AGENDA';

  pestanaActiva: 'CONSULTA' | 'RECETA' = 'CONSULTA';



  // --- DATOS DE CONSULTA MÉDICA ---

  consultaForm = {

    motivo: '',

    sintomas: '',

    observaciones: ''

  };



  diagnosticos: { nombre: string, descripcion: string }[] = [];

  nuevoDiagnostico = { nombre: '', descripcion: '' };



  tratamiento = { descripcion: '', fechaInicio: '', fechaFin: '' };



  // --- DATOS DE RECETA MÉDICA ---

  detallesReceta: DetalleRecetaDTO[] = [];

  nuevoMedicamento = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };

  observacionesReceta: string = '';



  ngOnInit(): void {

    this.cargarCitasDelDia();

  }



  cargarCitasDelDia(): void {

    this.citaService.listarTodas().subscribe({

      next: (data: any[]) => {

        // Filtrado por los estados requeridos (CONFIRMADA y EN_ESPERA)

        this.citasDelDia = data.filter(cita =>

          cita.estado === 'EN_ESPERA' || cita.estado === 'CONFIRMADA'

        );

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error('Error al cargar las citas:', err);

      }

    });

  }



  seleccionarCita(cita: any): void {

    this.citaSeleccionada = cita;

    this.consultaForm.motivo = cita.motivoConsulta || '';

    this.vistaActual = 'ATENCION';

    this.pestanaActiva = 'CONSULTA';

  }



  cambiarPestana(pestana: 'CONSULTA' | 'RECETA'): void {

    this.pestanaActiva = pestana;

    this.cdr.detectChanges();

  }



  agregarDiagnostico(): void {

    if (this.nuevoDiagnostico.nombre.trim()) {

      this.diagnosticos.push({ ...this.nuevoDiagnostico });

      this.nuevoDiagnostico = { nombre: '', descripcion: '' };

    }

  }



  quitarDiagnostico(index: number): void {

    this.diagnosticos.splice(index, 1);

  }



  agregarMedicamento(): void {

    if (this.nuevoMedicamento.medicamento.trim()) {

      this.detallesReceta.push({

        medicamento: this.nuevoMedicamento.medicamento,

        dosis: this.nuevoMedicamento.dosis,

        frecuencia: this.nuevoMedicamento.frecuencia,

        duracion: this.nuevoMedicamento.duracion

      });

      this.nuevoMedicamento = { medicamento: '', dosis: '', frecuencia: '', duracion: '' };

    }

  }



  quitarMedicamento(index: number): void {

    this.detallesReceta.splice(index, 1);

  }



  guardarTodo(): void {

    // 1. Actualizar el estado de la cita a ATENDIDA

    this.citaService.actualizarEstado(this.citaSeleccionada.idCita, 'ATENDIDA').subscribe();



    // 2. Estructurar la consulta médica para el backend

    const payloadConsulta = {

      motivoConsulta: this.consultaForm.motivo,

      sintomas: this.consultaForm.sintomas,

      diagnosticoGeneral: JSON.stringify(this.diagnosticos),

      tratamiento: JSON.stringify(this.tratamiento),        

      observaciones: this.consultaForm.observaciones,

      historiaClinica: { idHistoriaClinica: this.citaSeleccionada.idCita },

      citaMedica: { idCita: this.citaSeleccionada.idCita },

      medico: { idMedico: this.citaSeleccionada.medico?.idMedico || 1 }

    };



    this.consultaService.atenderCita(this.citaSeleccionada.idCita, payloadConsulta).subscribe({

      next: (consultaGuardada: any) => {

        this.consultaCreadaId = consultaGuardada.idConsulta;



        // 3. Si se agregaron medicamentos, registrar la receta con el DTO exacto

        if (this.detallesReceta.length > 0 && this.consultaCreadaId) {

          const payloadReceta: RecetaMedicaDTO = {

            observaciones: this.observacionesReceta,

            idConsulta: this.consultaCreadaId,

            detalles: this.detallesReceta

          };

         

          this.recetaService.generarReceta(payloadReceta).subscribe({

            next: () => {

              alert('¡Atención y receta médica guardadas con éxito!');

              this.volverAgenda();

            },

            error: (err) => {

              console.error('Error al generar la receta:', err);

              alert('Se guardó la consulta, pero ocurrió un problema con la receta.');

              this.volverAgenda();

            }

          });

        } else {

          alert('¡Atención registrada correctamente en la Historia Clínica!');

          this.volverAgenda();

        }

      },

      error: (err) => {

        console.error('Error al guardar la consulta:', err);

        alert('Ocurrió un error al registrar la atención médica.');

      }

    });

  }



  exportarPDF(): void {

    alert('¡Botón PDF configurado! Listo para integrar la librería de exportación física.');

  }



  volverAgenda(): void {

    this.citaSeleccionada = null;

    this.consultaCreadaId = null;

    this.vistaActual = 'AGENDA';

    this.diagnosticos = [];

    this.detallesReceta = [];

    this.observacionesReceta = '';

    this.consultaForm = { motivo: '', sintomas: '', observaciones: '' };

    this.tratamiento = { descripcion: '', fechaInicio: '', fechaFin: '' };

    this.cargarCitasDelDia();

  }

} 

