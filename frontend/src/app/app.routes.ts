import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'patients',
    loadComponent: () => import('./features/patients/patient-list/patient-list.component').then((m) => m.PatientListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'patients/new',
    loadComponent: () => import('./features/patients/patient-form/patient-form.component').then((m) => m.PatientFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'physician'] },
  },
  {
    path: 'patients/:id',
    loadComponent: () => import('./features/patients/patient-detail/patient-detail.component').then((m) => m.PatientDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'patients/:id/edit',
    loadComponent: () => import('./features/patients/patient-form/patient-form.component').then((m) => m.PatientFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'physician'] },
  },
  {
    path: 'procedures',
    loadComponent: () => import('./features/procedures/procedure-list/procedure-list.component').then((m) => m.ProcedureListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'procedures/new',
    loadComponent: () => import('./features/procedures/procedure-form/procedure-form.component').then((m) => m.ProcedureFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'procedures/:id',
    loadComponent: () => import('./features/procedures/procedure-form/procedure-form.component').then((m) => m.ProcedureFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'templates',
    loadComponent: () => import('./features/templates/template-list/template-list.component').then((m) => m.TemplateListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics-dashboard/analytics-dashboard.component').then((m) => m.AnalyticsDashboardComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
