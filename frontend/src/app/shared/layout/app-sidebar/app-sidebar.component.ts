import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../services/sidebar.service';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';

interface SubItem {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  icon: string;
  path?: string;
  subItems?: SubItem[];
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe
  ],
  templateUrl: './app-sidebar.component.html'
})
export class AppSidebarComponent implements OnInit, AfterViewInit {

  @ViewChildren('submenuContainer')
  submenuContainers!: QueryList<ElementRef>;

  // ====================================
  // OBSERVABLES
  // ====================================

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  openSubmenu: string | null = null;
  subMenuHeights: { [key: string]: number } = {};

  // ====================================
  // MENÚ PRINCIPAL (Vectores Clínicos Corregidos)
  // ====================================

  private menuMaestro: NavItem[] = [
    {
      name: 'Dashboard',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V6h12v2z"/></svg>',
      path: '/dashboard',
      roles: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA']
    },
    {
      name: 'Agenda Médica',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-7H7v2h7v-2zm-3 3H7v2h4v-2z"/></svg>',
      path: '/agenda',
      roles: ['MEDICO']
    },
    {
      name: 'Pacientes',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
      path: '/pacientes',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      name: 'Citas Médicas',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H10v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
      path: '/citas',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      name: 'Historia Clínica',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
      path: '/historias',
      roles: ['ADMINISTRADOR', 'MEDICO']
    },
    {
      name: 'Recetas Médicas',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M18 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 11h-3v3h-2v-3H8v-2h3V8h2v3h3v2z"/></svg>',
      path: '/recetas',
      roles: ['ADMINISTRADOR', 'MEDICO']
    },
    {
      name: 'Personal Médico',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.66-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zM9.5 11c1.66 0 3-1.34 3-3s-1.34-3-3-3s-3 1.34-3 3s1.34 3 3 3zm10-2c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2z"/></svg>',
      roles: ['ADMINISTRADOR'],
      subItems: [
        { name: 'Gestión de Médicos', path: '/medicos' },
        { name: 'Especialidades', path: '/especialidades' }
      ]
    },
    {
      name: 'Pagos y Facturación',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA'],
      subItems: [
        { name: 'Registrar Pago', path: '/pagos' },
        { name: 'Historial de Caja', path: '/pagos/historial' }
      ]
    },
    {
      name: 'Reportes Globales',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/></svg>',
      path: '/reportes',
      roles: ['ADMINISTRADOR']
    }
  ];

  private menuOtrosMaestro: NavItem[] = [
    {
      name: 'Seguridad y Usuarios',
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>',
      path: '/seguridad',
      roles: ['ADMINISTRADOR']
    },
    {
      name: 'Auditoría del Sistema',
      // Icono de escudo/ojo que representa trazabilidad y seguridad
      icon: '<svg class="fill-current" width="22" height="22" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
      path: '/auditoria',
      roles: ['ADMINISTRADOR']
    },
    {
      name: 'Mi Perfil',
      icon: '<svg class="fill-current" width="18" height="19" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
      path: '/perfil',
      roles: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA']
    }
  ];

  navItems: NavItem[] = [];
  othersItems: NavItem[] = [];

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // AQUÍ VA LA INICIALIZACIÓN
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit(): void {
    const rolActual = localStorage.getItem('rol')?.toUpperCase() ?? 'RECEPCIONISTA';
    const modulosStr = localStorage.getItem('modulos');
    const modulosPermitidos: string[] = modulosStr ? JSON.parse(modulosStr) : [];

    // Filtro original por Roles
    let navs = this.menuMaestro.filter(item => item.roles.includes(rolActual));
    let others = this.menuOtrosMaestro.filter(item => item.roles.includes(rolActual));

    // NUEVO: Filtro súper estricto basado en los checkboxes de los módulos asignados
    // (Solo aplicamos si el usuario tiene una lista de módulos configurada en DB)
    if (modulosPermitidos && modulosPermitidos.length > 0) {
      navs = navs.filter(item => modulosPermitidos.includes(item.name));
      
      // Mantenemos "Mi Perfil" visible para todos, y verificamos el resto
      others = others.filter(item => item.name === 'Mi Perfil' || modulosPermitidos.includes(item.name));
    }

    this.navItems = navs;
    this.othersItems = others;

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkActiveRoute(event.urlAfterRedirects);
      });

    this.checkActiveRoute(this.router.url);
  }

  ngAfterViewInit(): void {
    this.calculateSubMenuHeights();
  }

  calculateSubMenuHeights(): void {
    setTimeout(() => {
      this.submenuContainers?.forEach(container => {
        const id = container.nativeElement.id;
        this.subMenuHeights[id] =
          container.nativeElement.scrollHeight;
      });

      this.cdr.detectChanges();
    });
  }

  toggleSubmenu(section: 'main' | 'others', index: number): void {
    const key = `${section}-${index}`;
    this.openSubmenu =
      this.openSubmenu === key ? null : key;
  }

  checkActiveRoute(url: string): void {
    this.navItems.forEach((item, index) => {
      if (item.subItems?.some(sub => url.includes(sub.path))) {
        this.openSubmenu = `main-${index}`;
      }
    });

    this.othersItems.forEach((item, index) => {
      if (item.subItems?.some(sub => url.includes(sub.path))) {
        this.openSubmenu = `others-${index}`;
      }
    });
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  onSubmenuClick(): void {
    this.sidebarService.setMobileOpen(false);
  }

  onSidebarMouseEnter(): void {
    this.sidebarService.setHovered(true);
  }

  onSidebarMouseLeave(): void {
    this.sidebarService.setHovered(false);
  }
}