# ProcedureFlow — Frontend Software Requirements Specification

**Version:** 1.0.0
**Date:** 2026-03-14
**Project:** ProcedureFlow - AI-Powered Medical Procedure Documentation Platform
**Tech Stack:** Angular 17 · Angular Material 17 · TypeScript 5.2 · RxJS 7 · Chart.js

---

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for the ProcedureFlow Angular frontend SPA. It covers component architecture, routing, state management, API integration, and UI/UX specifications.

### 1.2 Scope
A single-page application (SPA) consumed by physicians, nurses, technicians, and administrators for clinical procedure documentation.

### 1.3 Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 17 (standalone components) |
| UI Library | Angular Material 17 + CDK |
| Language | TypeScript 5.2 (strict mode) |
| Styling | SCSS + Angular Material theming |
| State | RxJS BehaviorSubject in services |
| HTTP | Angular HttpClient |
| Charts | Chart.js 4.x + ng2-charts |
| Real-time | Socket.io client 4.x |
| Build | Angular CLI 17 |

---

## 2. Project Structure

```
frontend/
├── package.json
├── angular.json
├── tsconfig.json
└── src/
    ├── main.ts                      ← bootstrapApplication()
    ├── index.html
    ├── styles.scss                  ← Global styles + Angular Material theme
    ├── environments/
    │   ├── environment.ts           ← { apiUrl, wsUrl, production: false }
    │   └── environment.prod.ts
    └── app/
        ├── app.component.ts         ← Root component (router-outlet only)
        ├── app.config.ts            ← provideRouter, provideHttpClient, provideAnimations
        ├── app.routes.ts            ← Lazy-loaded route definitions
        ├── core/
        │   ├── models/
        │   │   ├── user.model.ts
        │   │   ├── patient.model.ts
        │   │   ├── procedure.model.ts
        │   │   └── template.model.ts
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   ├── patient.service.ts
        │   │   ├── procedure.service.ts
        │   │   ├── template.service.ts
        │   │   ├── report.service.ts
        │   │   ├── billing.service.ts
        │   │   └── analytics.service.ts
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts
        │   └── guards/
        │       ├── auth.guard.ts
        │       └── role.guard.ts
        ├── features/
        │   ├── auth/login/
        │   ├── dashboard/
        │   ├── patients/
        │   │   ├── patient-list/
        │   │   ├── patient-detail/
        │   │   └── patient-form/
        │   ├── procedures/
        │   │   ├── procedure-list/
        │   │   └── procedure-form/
        │   ├── templates/
        │   │   └── template-list/
        │   └── analytics/
        │       └── analytics-dashboard/
        └── shared/
            └── components/
                ├── navbar/
                └── sidebar/
```

---

## 3. Routing

All routes use Angular's lazy-loaded standalone component pattern (`loadComponent`).

| Path | Component | Guard | Roles |
|------|-----------|-------|-------|
| `/` | → redirect `/dashboard` | — | — |
| `/login` | LoginComponent | — | — |
| `/dashboard` | DashboardComponent | authGuard | all |
| `/patients` | PatientListComponent | authGuard | all |
| `/patients/new` | PatientFormComponent | authGuard, roleGuard | admin, physician |
| `/patients/:id` | PatientDetailComponent | authGuard | all |
| `/patients/:id/edit` | PatientFormComponent | authGuard, roleGuard | admin, physician |
| `/procedures` | ProcedureListComponent | authGuard | all |
| `/procedures/new` | ProcedureFormComponent | authGuard | all |
| `/procedures/:id` | ProcedureFormComponent | authGuard | all |
| `/templates` | TemplateListComponent | authGuard | all |
| `/analytics` | AnalyticsDashboardComponent | authGuard | all |
| `**` | → redirect `/dashboard` | — | — |

---

## 4. Data Models (TypeScript Interfaces)

### 4.1 User

```typescript
type UserRole = 'physician' | 'nurse' | 'technician' | 'admin';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  specialtyId?: string;
  organizationId: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### 4.2 Patient

```typescript
interface Patient {
  id: string;
  organizationId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;      // ISO date string
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  insuranceInfo?: Record<string, any>;
  emrId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 4.3 Procedure

```typescript
type ProcedureStatus = 'draft' | 'in-progress' | 'completed' | 'signed';

interface Procedure {
  id: string;
  patientId: string;
  patient?: Patient;
  physicianId: string;
  physician?: User;
  templateId?: string;
  template?: Template;
  specialtyId: string;
  specialty?: { id: string; name: string; code: string };
  organizationId: string;
  status: ProcedureStatus;
  title: string;
  procedureDate: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  findings?: string;
  impression?: string;
  complications?: string;
  medications?: any[];
  equipment?: any[];
  documentationData?: Record<string, any>;
  qualityScore?: number;
  images?: ProcedureImage[];
}
```

### 4.4 Template

```typescript
type FieldType = 'text' | 'textarea' | 'checkbox' | 'select' | 'number' | 'date' | 'radio' | 'image';

interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
}

interface Template {
  id: string;
  organizationId: string;
  specialtyId: string;
  specialty?: { id: string; name: string; code: string };
  name: string;
  description?: string;
  fields: TemplateField[];
  isActive: boolean;
  version: number;
}
```

### 4.5 Shared Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}
```

---

## 5. Services

### 5.1 AuthService (`providedIn: 'root'`)

```typescript
class AuthService {
  currentUser$: BehaviorSubject<User | null>   // Persisted to localStorage
  isAuthenticated$: Observable<boolean>         // Derived from currentUser$
  get currentUser(): User | null
  get accessToken(): string | null

  login(credentials: LoginCredentials): Observable<AuthResponse>
  logout(): void                                // Clears storage, navigates /login
  refreshToken(): Observable<AuthResponse>
  getProfile(): Observable<User>
  hasRole(...roles: string[]): boolean
}
```

**Storage keys:** `accessToken`, `refreshToken`, `user`

### 5.2 PatientService

```typescript
class PatientService {
  getAll(params?: QueryParams): Observable<ApiResponse<Patient[]>>
  getById(id: string): Observable<Patient>
  create(patient: PatientFormData): Observable<Patient>
  update(id: string, data: Partial<PatientFormData>): Observable<Patient>
  delete(id: string): Observable<void>
  getProcedureHistory(id: string): Observable<Procedure[]>
}
```

### 5.3 ProcedureService

```typescript
class ProcedureService {
  getAll(params?: QueryParams): Observable<ApiResponse<Procedure[]>>
  getById(id: string): Observable<Procedure>
  create(data: ProcedureFormData): Observable<Procedure>
  update(id: string, data: Partial<ProcedureFormData>): Observable<Procedure>
  updateStatus(id: string, status: ProcedureStatus): Observable<Procedure>
  autoSave(id: string, data: Partial<ProcedureFormData>): Observable<{ savedAt: string }>
  addImage(id: string, file: File): Observable<ProcedureImage>
  removeImage(id: string, imageId: string): Observable<void>
  getByPatient(patientId: string): Observable<Procedure[]>
  delete(id: string): Observable<void>
}
```

### 5.4 TemplateService

```typescript
class TemplateService {
  getAll(params?: QueryParams): Observable<Template[]>
  getById(id: string): Observable<Template>
  getBySpecialty(specialtyId: string): Observable<Template[]>
  create(template: Partial<Template>): Observable<Template>
  update(id: string, data: Partial<Template>): Observable<Template>
  delete(id: string): Observable<void>
  clone(id: string): Observable<Template>
}
```

### 5.5 AnalyticsService

```typescript
class AnalyticsService {
  getDashboard(): Observable<DashboardData>
  getProcedureStats(params?: { startDate?: string; endDate?: string }): Observable<ProcedureStats>
  getQualityMetrics(): Observable<QualityMetrics>
  getCompletionRates(): Observable<CompletionRates>
}
```

### 5.6 ReportService

```typescript
class ReportService {
  generate(procedureId: string, type: 'pdf' | 'hl7' | 'structured'): Observable<Report>
  getByProcedure(procedureId: string): Observable<Report[]>
  download(reportId: string): Observable<Blob>
}
```

### 5.7 BillingService

```typescript
class BillingService {
  getSuggestions(procedureId: string): Observable<BillingSuggestion[]>
  create(billing: any): Observable<BillingCode>
  getByProcedure(procedureId: string): Observable<BillingCode[]>
  update(id: string, data: any): Observable<BillingCode>
}
```

---

## 6. Interceptors & Guards

### 6.1 AuthInterceptor (`HttpInterceptorFn`)

**Behavior:**
1. Reads `accessToken` from `localStorage`
2. Appends `Authorization: Bearer <token>` header to every outgoing request
3. On HTTP 401 (and request is not `/auth/`): calls `authService.refreshToken()`
4. On success: retries original request with new access token
5. On refresh failure: calls `authService.logout()` → redirects to `/login`

### 6.2 AuthGuard (`CanActivateFn`)

Checks `localStorage` for a valid token AND `authService.currentUser` is set. Redirects to `/login` if not authenticated.

### 6.3 RoleGuard (`CanActivateFn`)

Reads `route.data['roles']` (string array). Calls `authService.hasRole(...roles)`. Redirects to `/dashboard` if role check fails.

---

## 7. Component Specifications

### 7.1 Layout Pattern

All authenticated pages use this shell:
```html
<div class="app-layout">
  <app-sidebar></app-sidebar>
  <div class="main-content">
    <app-navbar></app-navbar>
    <div class="page-content">
      <!-- page content here -->
    </div>
  </div>
</div>
```

### 7.2 LoginComponent

- **Route:** `/login`
- **Form:** `email` (required, email validator) + `password` (required, min 6)
- **On submit:** `AuthService.login()` → navigate to `/dashboard`
- **Error display:** Shows server error message below the form
- **UI:** Centered card with ProcedureFlow logo, no sidebar/navbar

### 7.3 DashboardComponent

- **Route:** `/dashboard`
- **Data:** `AnalyticsService.getDashboard()`
- **Displays:**
  - 4 stats cards: Procedures This Month, Total Patients, Avg Quality Score, Total Procedures
  - Recent procedures table: Patient, Procedure, Specialty, Status (badge), Date, Action (open)
  - Quick action buttons: New Procedure, New Patient

### 7.4 PatientListComponent

- **Route:** `/patients`
- **Features:** Search by name/MRN (enter key triggers), paginated table
- **Table columns:** MRN, Name, DOB, Gender, Phone, Actions (View / Edit / New Procedure)
- **Pagination:** `mat-paginator` with page sizes [10, 20, 50]

### 7.5 PatientDetailComponent

- **Route:** `/patients/:id`
- **Left card:** Patient demographics (MRN, DOB, Gender, Email, Phone, EMR ID)
- **Right card:** Procedure history timeline — date, title, specialty, status badge, View link

### 7.6 PatientFormComponent

- **Routes:** `/patients/new`, `/patients/:id/edit`
- **Fields:** MRN*, First Name*, Last Name*, Date of Birth*, Gender, Email, Phone, Address, EMR ID
- **Validation:** Required fields, email format
- **On success:** Redirect to `/patients/:id`

### 7.7 ProcedureListComponent

- **Route:** `/procedures`
- **Filter:** Status dropdown (All / draft / in-progress / completed / signed)
- **Table columns:** Patient (name + MRN), Procedure, Specialty, Physician, Date, Status badge, Actions
- **Pagination:** `mat-paginator`

### 7.8 ProcedureFormComponent

- **Routes:** `/procedures/new`, `/procedures/:id`
- **Left panel (main form):**
  - Patient ID field (autocomplete-ready)
  - Title, Specialty select, Template select (loads after specialty)
  - Procedure Date
  - Notes, Findings, Impression, Complications (textareas)
  - Image upload section (file input, previews) — edit mode only
- **Right panel (sidebar):**
  - Status transition buttons (based on current status workflow)
  - Billing code suggestions panel (CPT/ICD codes with amounts)
- **Auto-save:** `interval(30000)` subscription calls `ProcedureService.autoSave()` when form is dirty
- **Auto-save indicator:** Shows "Auto-saved HH:MM" timestamp above form
- **On save:** Snackbar confirmation; redirect to `/procedures/:id` on create

### 7.9 TemplateListComponent

- **Route:** `/templates`
- **Layout:** Card grid
- **Each card:** Name, specialty, description, field count, version, active/inactive chip
- **Admin actions:** Clone button, Deactivate button (with confirm dialog)

### 7.10 AnalyticsDashboardComponent

- **Route:** `/analytics`
- **Stats cards:** Total Procedures, Total Patients, Completion Rate %, Avg Quality Score
- **Data tables:**
  - Procedures by Status
  - Completion Summary (total, completed, signed, rate)

### 7.11 NavbarComponent

- **Position:** Fixed top, height 64px
- **Contents:** Spacer, notifications bell button, user menu button (avatar + name)
- **User menu items:** Profile, Logout

### 7.12 SidebarComponent

- **Position:** Fixed left, width 240px
- **Navigation items:**
  | Label | Icon | Route |
  |-------|------|-------|
  | Dashboard | `dashboard` | `/dashboard` |
  | Patients | `people` | `/patients` |
  | Procedures | `medical_services` | `/procedures` |
  | Templates | `description` | `/templates` |
  | Analytics | `bar_chart` | `/analytics` |
- **Active state:** Highlighted link with accent color
- **Admin-only items:** Admin settings (when implemented)

---

## 8. UI/UX Specifications

### 8.1 Color Scheme

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1a237e` / `#1976d2` | Sidebar bg, buttons |
| Accent | `#43a047` | Success, completed status |
| Warn | `#f44336` | Errors, destructive actions |
| Background | `#f5f5f5` | Page background |
| Card | `#ffffff` | Mat cards |
| Text primary | `#212121` | Body text |
| Text secondary | `#666666` | Labels, hints |

### 8.2 Status Badge Colors

| Status | Background | Text |
|--------|-----------|------|
| `draft` | `#e0e0e0` | `#616161` |
| `in-progress` | `#e3f2fd` | `#1565c0` |
| `completed` | `#e8f5e9` | `#2e7d32` |
| `signed` | `#f3e5f5` | `#6a1b9a` |

Applied via CSS class: `.status-badge.{status}`

### 8.3 Layout Dimensions

| Element | Value |
|---------|-------|
| Sidebar width | 240px |
| Navbar height | 64px |
| Content padding | 24px |
| Card margin-bottom | 16px |
| Stats grid gap | 16px |

### 8.4 Typography

- Font family: `Roboto, sans-serif` (Google Fonts)
- Page title (h1): 24px, weight 500
- Section title (h2): 20px, weight 500
- Body: 14px, weight 400
- Small / meta: 11–12px, color `#999`

### 8.5 Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|---------|
| ≥ 1024px | Full layout: sidebar + content |
| < 1024px | Sidebar collapses to icon-only or drawer |
| < 768px | Tables scroll horizontally; stats stack |

---

## 9. Environment Configuration

### `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
};
```

### `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: '',
};
```

---

## 10. Build & Development

```bash
# Install dependencies
cd frontend
npm install

# Development server (http://localhost:4200)
npm start

# Production build
npm run build
# Output: dist/procedureflow-frontend/

# Proxy API in development (avoids CORS)
# Create proxy.conf.json:
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
# Then: ng serve --proxy-config proxy.conf.json
```

---

## 11. Angular Material Module Usage

| Module | Used By |
|--------|---------|
| MatCardModule | All pages |
| MatButtonModule | All pages |
| MatIconModule | All pages |
| MatFormFieldModule + MatInputModule | All forms |
| MatTableModule + MatPaginatorModule | List pages |
| MatSelectModule | Filter dropdowns, form selects |
| MatSnackBarModule | Success/error notifications |
| MatProgressSpinnerModule | Loading states |
| MatMenuModule | User dropdown in navbar |
| MatChipsModule | Template active/inactive badge |
| MatToolbarModule | Navbar |
| MatListModule | Sidebar navigation |
| MatDatepickerModule | Date fields |

---

## 12. Key Implementation Notes

1. **Standalone components only** — No `NgModule` declarations. All components use `standalone: true` and import their dependencies directly.
2. **Lazy loading** — All feature components are lazy-loaded via `loadComponent` in routes, reducing initial bundle size.
3. **Functional guards** — `authGuard` and `roleGuard` use the `CanActivateFn` functional signature (Angular 15+ style).
4. **Functional interceptor** — `authInterceptor` uses `HttpInterceptorFn` registered via `provideHttpClient(withInterceptors([authInterceptor]))`.
5. **No NgRx** — State managed with `BehaviorSubject` in services (`AuthService.currentUser$`). Sufficient for MVP scope.
6. **Auto-save pattern** — `ProcedureFormComponent` uses `interval(30000)` from RxJS, unsubscribed in `ngOnDestroy` to prevent memory leaks.
7. **Token storage** — Access/refresh tokens stored in `localStorage`. For higher security in future, consider `HttpOnly` cookies.
8. **Error handling** — HTTP errors surface via Angular Material Snackbar. Form validation errors shown inline via `mat-error`.
