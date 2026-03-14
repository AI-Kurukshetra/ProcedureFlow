import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-logo">
        <mat-icon class="logo-icon">medical_services</mat-icon>
        <span class="logo-text">ProcedureFlow</span>
      </div>
      <mat-nav-list>
        <ng-container *ngFor="let item of navItems">
          <a mat-list-item
             *ngIf="!item.roles || hasRole(item.roles)"
             [routerLink]="item.route"
             routerLinkActive="active-link"
             class="nav-item">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </ng-container>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      background: #1a237e;
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2);
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      background: rgba(0,0,0,0.2);
    }
    .logo-icon { color: #90caf9; font-size: 28px; }
    .logo-text { font-size: 18px; font-weight: 600; color: white; }
    mat-nav-list { padding-top: 8px; }
    .nav-item { color: rgba(255,255,255,0.85) !important; border-radius: 4px; margin: 2px 8px; }
    .nav-item:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
    .active-link { background: rgba(255,255,255,0.15) !important; color: white !important; }
    mat-icon { color: rgba(255,255,255,0.7); }
    .active-link mat-icon { color: #90caf9; }
  `],
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Patients', icon: 'people', route: '/patients' },
    { label: 'Procedures', icon: 'medical_services', route: '/procedures' },
    { label: 'Templates', icon: 'description', route: '/templates' },
    { label: 'Analytics', icon: 'bar_chart', route: '/analytics' },
  ];

  constructor(private authService: AuthService) {}

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(...roles);
  }
}
