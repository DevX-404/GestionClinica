import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../shared/services/usuario.service';
import { MedicoService } from '../../shared/services/medico.service';
import { HorarioMedicoService } from '../../shared/services/horario-medico.service';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private medicoService = inject(MedicoService);
  private horarioService = inject(HorarioMedicoService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'DATOS' | 'CREDENCIALES' | 'AGENDA' | 'SEGURIDAD' = 'DATOS';
  
  usuarioActual: any = null;
  medicoAsociado: any = null; // Guardará el CMP y RNE si es médico
  horariosMedico: any[] = []; // Guardará su agenda

  usernameLocal: string = '';
  rolLocal: string = '';
  isLoading: boolean = true;
  isLoadingAgenda: boolean = false;

  passwordActual: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  
  globalMsg: string = '';
  globalMsgType: 'success' | 'error' | 'warning' | 'info' = 'info';

  ngOnInit(): void {
    this.usernameLocal = localStorage.getItem('username') || '';
    this.rolLocal = localStorage.getItem('rol') || 'USUARIO';
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.usuarioService.obtenerPerfil(this.usernameLocal).subscribe({
      next: (usuario: any) => {
        this.usuarioActual = usuario;
        
        // Si es médico, jalamos también su CMP, RNE y Horarios
        if (this.rolLocal === 'MEDICO') {
          this.cargarFichaMedica(usuario.email); // En tu lógica, el email suele ser el username
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoading = false;
        this.mostrarMensajeGlobal('Error al cargar la identidad del perfil.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cargarFichaMedica(correoUsuario: string): void {
    // Buscamos a todos los médicos y filtramos el que tenga el correo del usuario actual
    this.medicoService.listarTodos().subscribe({
      next: (medicos) => {
        const medico = medicos.find(m => m.correo === correoUsuario);
        if (medico) {
          this.medicoAsociado = medico;
          this.cargarHorarios(medico.idMedico!);
        } else {
          this.isLoading = false;
        }
      },
      error: () => this.isLoading = false
    });
  }

  cargarHorarios(idMedico: number): void {
    this.isLoadingAgenda = true;
    this.horarioService.listarPorMedico(idMedico).subscribe({
      next: (data) => {
        // Ordenamos los días alfabéticamente
        this.horariosMedico = data.sort((a: any, b: any) => a.diaSemana.localeCompare(b.diaSemana));
        this.isLoadingAgenda = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingAgenda = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarTab(tab: 'DATOS' | 'CREDENCIALES' | 'AGENDA' | 'SEGURIDAD'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  actualizarContrasena(): void {
    if (!this.passwordActual) {
      this.mostrarMensajeGlobal('Debes ingresar tu contraseña actual por seguridad.', 'warning'); return;
    }
    if (this.nuevaPassword.length < 6) {
      this.mostrarMensajeGlobal('La nueva contraseña debe tener al menos 6 caracteres.', 'warning'); return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mostrarMensajeGlobal('La validación no coincide. Repite la nueva contraseña.', 'warning'); return;
    }

    // Usamos el NUEVO endpoint exclusivo del perfil
    this.usuarioService.cambiarPasswordPerfil(this.usernameLocal, this.passwordActual, this.nuevaPassword).subscribe({
      next: () => {
        this.mostrarMensajeGlobal('¡Tu credencial de acceso fue actualizada correctamente!', 'success');
        this.passwordActual = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 400 || err.status === 500) {
          this.mostrarMensajeGlobal('La contraseña actual ingresada es incorrecta.', 'error');
        } else {
          this.mostrarMensajeGlobal('Error en el servidor al actualizar contraseña.', 'error');
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Utilidad visual para el HTML
  formatearFechaLarga(fechaIso: string): string {
    if(!fechaIso || !fechaIso.includes('-')) return fechaIso; 
    const fecha = new Date(fechaIso + 'T00:00:00');
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  guardarFirma(): void {
    this.mostrarMensajeGlobal('Firma digital almacenada temporalmente (Pendiente conexión a BD).', 'info');
  }

  mostrarMensajeGlobal(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.globalMsg = msg;
    this.globalMsgType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.globalMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}