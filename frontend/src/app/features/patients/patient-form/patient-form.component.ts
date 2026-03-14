import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule, NavbarComponent, SidebarComponent,
  ],
  templateUrl: './patient-form.component.html',
})
export class PatientFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  isEdit = false;
  patientId = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      mrn: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: [''],
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      emrId: [''],
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.params['id'];
    if (this.patientId) {
      this.isEdit = true;
      this.loading = true;
      this.patientService.getById(this.patientId).subscribe({
        next: (p) => { this.form.patchValue(p); this.loading = false; },
        error: () => { this.loading = false; this.error = 'Failed to load patient'; },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const op = this.isEdit
      ? this.patientService.update(this.patientId, this.form.value)
      : this.patientService.create(this.form.value);

    op.subscribe({
      next: (p) => this.router.navigate(['/patients', p.id]),
      error: (err) => { this.error = err.error?.error || 'Save failed'; this.saving = false; },
    });
  }
}
