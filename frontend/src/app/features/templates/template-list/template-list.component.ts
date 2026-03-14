import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { Template } from '../../../core/models/template.model';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { Specialty } from '../../../core/models/specialty.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatChipsModule,
    NavbarComponent, SidebarComponent,
  ],
  templateUrl: './template-list.component.html',
})
export class TemplateListComponent implements OnInit {
  templates: Template[] = [];
  specialties: Specialty[] = [];
  loading = true;
  filterSpecialty = '';
  isAdmin = false;

  constructor(
    private templateService: TemplateService,
    private authService: AuthService,
    private specialtyService: SpecialtyService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin');
    this.specialtyService.getAll().subscribe({ next: (specialties) => (this.specialties = specialties) });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.templateService.getAll({ specialtyId: this.filterSpecialty || undefined }).subscribe({
      next: (templates) => { this.templates = templates; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  clone(id: string): void {
    this.templateService.clone(id).subscribe({ next: () => this.load() });
  }

  delete(id: string): void {
    if (confirm('Deactivate this template?')) {
      this.templateService.delete(id).subscribe({ next: () => this.load() });
    }
  }
}
