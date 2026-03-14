import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, interval, of, Subscription, switchMap } from 'rxjs';
import { BillingService } from '../../../core/services/billing.service';
import { PatientService } from '../../../core/services/patient.service';
import { ProcedureService } from '../../../core/services/procedure.service';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { TemplateService } from '../../../core/services/template.service';
import { Patient } from '../../../core/models/patient.model';
import { Procedure, ProcedureStatus, ProcedureImage } from '../../../core/models/procedure.model';
import { Specialty } from '../../../core/models/specialty.model';
import { Template, TemplateField } from '../../../core/models/template.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

interface BillingPanelCode {
  cptCode?: string;
  icdCode?: string;
  description?: string;
  amount?: number;
  status?: string;
  source: 'confirmed' | 'suggested';
}

@Component({
  selector: 'app-procedure-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSnackBarModule,
    NavbarComponent,
    SidebarComponent,
  ],
  templateUrl: './procedure-form.component.html',
  styleUrls: ['./procedure-form.component.scss'],
})
export class ProcedureFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  saving = false;
  isEdit = false;
  procedureId = '';
  procedure: Procedure | null = null;
  patients: Patient[] = [];
  templates: Template[] = [];
  specialties: Specialty[] = [];
  selectedTemplate: Template | null = null;
  billingCodes: BillingPanelCode[] = [];
  autoSaveSubscription?: Subscription;
  lastSaved?: Date;
  images: File[] = [];
  imagePreviewUrls: string[] = [];

  statusFlow: Record<string, ProcedureStatus[]> = {
    draft: ['in-progress'],
    'in-progress': ['completed', 'draft'],
    completed: ['signed'],
    signed: [],
  };

  constructor(
    private fb: FormBuilder,
    private procedureService: ProcedureService,
    private templateService: TemplateService,
    private billingService: BillingService,
    private patientService: PatientService,
    private specialtyService: SpecialtyService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      specialtyId: ['', Validators.required],
      templateId: [''],
      title: ['', Validators.required],
      procedureDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: [''],
      findings: [''],
      impression: [''],
      complications: [''],
      documentationData: this.fb.group({}),
    });
  }

  get documentationGroup(): FormGroup {
    return this.form.get('documentationData') as FormGroup;
  }

  ngOnInit(): void {
    this.procedureId = this.route.snapshot.params['id'];
    const patientId = this.route.snapshot.queryParams['patientId'];
    if (patientId) {
      this.form.patchValue({ patientId });
    }

    this.loadLookups();

    if (this.procedureId) {
      this.isEdit = true;
      this.loading = true;
      this.procedureService.getById(this.procedureId).subscribe({
        next: (procedure) => {
          this.procedure = procedure;
          this.form.patchValue({
            patientId: procedure.patientId,
            specialtyId: procedure.specialtyId,
            templateId: procedure.templateId || '',
            title: procedure.title,
            procedureDate: procedure.procedureDate,
            notes: procedure.notes || '',
            findings: procedure.findings || '',
            impression: procedure.impression || '',
            complications: procedure.complications || '',
          });
          this.imagePreviewUrls = (procedure.images || []).map((image) => image.filePath);
          if (procedure.specialtyId) {
            this.loadTemplates(procedure.specialtyId, procedure.templateId, procedure.documentationData || {});
          }
          this.loadBillingSuggestions();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }

    this.autoSaveSubscription = interval(30000).subscribe(() => {
      if (this.isEdit && this.form.dirty) {
        this.autoSave();
      }
    });
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
  }

  onSpecialtyChange(specialtyId: string): void {
    this.form.patchValue({ templateId: '' });
    this.selectedTemplate = null;
    this.syncTemplateControls([]);
    this.loadTemplates(specialtyId);
  }

  onTemplateChange(templateId: string): void {
    this.selectedTemplate = this.templates.find((template) => template.id === templateId) || null;
    this.syncTemplateControls(this.selectedTemplate?.fields || [], this.procedure?.documentationData || {});
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }

    Array.from(input.files).forEach((file) => {
      this.images.push(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        this.imagePreviewUrls.push(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  autoSave(): void {
    if (!this.procedureId) {
      return;
    }

    this.procedureService.autoSave(this.procedureId, this.form.value).subscribe({
      next: () => {
        this.lastSaved = new Date();
        this.form.markAsPristine();
      },
    });
  }

  changeStatus(status: ProcedureStatus): void {
    if (!this.procedureId) {
      return;
    }

    this.procedureService.updateStatus(this.procedureId, status).subscribe({
      next: (procedure) => {
        this.procedure = procedure;
        this.snackBar.open(`Status changed to ${status}`, 'Close', { duration: 3000 });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const request$ = this.isEdit
      ? this.procedureService.update(this.procedureId, this.form.value)
      : this.procedureService.create(this.form.value);

    request$.subscribe({
      next: (procedure) => {
        this.procedure = procedure;
        this.uploadPendingImages(procedure.id).subscribe({
          next: () => {
            this.images = [];
            this.saving = false;
            this.snackBar.open('Procedure saved', 'Close', { duration: 3000 });

            if (!this.isEdit) {
              this.router.navigate(['/procedures', procedure.id]);
              return;
            }

            this.loadBillingSuggestions();
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Procedure saved, but image upload failed', 'Close', { duration: 4000 });
          },
        });
      },
      error: () => (this.saving = false),
    });
  }

  getNextStatuses(): ProcedureStatus[] {
    if (!this.procedure?.status) {
      return [];
    }

    return this.statusFlow[this.procedure.status] || [];
  }

  trackField(index: number, field: TemplateField): string {
    return field.id;
  }

  private loadLookups(): void {
    this.patientService.getAll({ page: 1, limit: 100 }).subscribe({
      next: (response) => (this.patients = response.data),
    });

    this.specialtyService.getAll().subscribe({
      next: (specialties) => (this.specialties = specialties),
    });
  }

  private loadTemplates(
    specialtyId: string,
    selectedTemplateId = '',
    documentationData: Record<string, any> = {}
  ): void {
    this.templateService.getBySpecialty(specialtyId).subscribe({
      next: (templates) => {
        this.templates = templates;

        if (!selectedTemplateId) {
          this.syncTemplateControls([]);
          return;
        }

        this.selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
        this.form.patchValue({ templateId: selectedTemplateId });
        this.syncTemplateControls(this.selectedTemplate?.fields || [], documentationData);
      },
    });
  }

  private loadBillingSuggestions(): void {
    if (!this.procedureId) {
      return;
    }

    forkJoin({
      suggestions: this.billingService.getSuggestions(this.procedureId),
      existing: this.billingService.getByProcedure(this.procedureId),
    }).subscribe({
      next: ({ suggestions, existing }) => {
        this.billingCodes = [
          ...existing.map((code) => ({ ...code, source: 'confirmed' })),
          ...suggestions.map((code) => ({ ...code, source: 'suggested' })),
        ];
      },
    });
  }

  private syncTemplateControls(fields: TemplateField[], values: Record<string, any> = {}): void {
    Object.keys(this.documentationGroup.controls).forEach((controlName) => {
      this.documentationGroup.removeControl(controlName);
    });

    for (const field of fields) {
      this.documentationGroup.addControl(
        field.id,
        this.fb.control(
          values[field.id] ?? this.defaultFieldValue(field),
          field.required ? Validators.required : []
        )
      );
    }
  }

  private defaultFieldValue(field: TemplateField): string | boolean {
    if (field.type === 'checkbox') {
      return false;
    }

    return '';
  }

  private uploadPendingImages(procedureId: string) {
    if (!this.images.length) {
      return of([]);
    }

    return forkJoin(this.images.map((file) => this.procedureService.addImage(procedureId, file))).pipe(
      switchMap((uploadedImages: ProcedureImage[]) => {
        const existingImages = this.procedure?.images || [];
        this.procedure = {
          ...(this.procedure as Procedure),
          images: [...existingImages, ...uploadedImages],
        };
        this.imagePreviewUrls = (this.procedure.images || []).map((image) => image.filePath);
        return of(uploadedImages);
      })
    );
  }
}
