# ProcedureFlow — Backend Software Requirements Specification

**Version:** 1.0.0
**Date:** 2026-03-14
**Project:** ProcedureFlow - AI-Powered Medical Procedure Documentation Platform
**Tech Stack:** Node.js · Express.js · PostgreSQL · Sequelize ORM · JWT · Socket.io

---

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for the ProcedureFlow backend REST API. It serves as the authoritative reference for developers building, maintaining, and extending the server-side system.

### 1.2 Scope
The backend provides a RESTful HTTP API and WebSocket server consumed by the Angular frontend. It covers:
- Authentication & Authorization
- Patient Management
- Procedure Documentation (create, real-time save, image upload, status workflow)
- Template Management (per-specialty dynamic forms)
- Report Generation (PDF, HL7)
- Billing Code Suggestions
- Analytics & Quality Metrics
- Compliance Audit Logging

### 1.3 Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4.x |
| ORM | Sequelize 6.x |
| Database | PostgreSQL 15 |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io 4.x |
| File handling | Multer |
| PDF generation | PDFKit |
| Logging | Winston + Morgan |
| Validation | express-validator / Joi |
| Security | helmet, cors, express-rate-limit |

---

## 2. Database Schema

### 2.1 Entity Relationship Overview

```
organizations ──< users
organizations ──< patients
organizations ──< templates
organizations ──< procedures
specialties   ──< users
specialties   ──< templates
specialties   ──< procedures
patients      ──< procedures
patients      ──< consents
users         ──< procedures (as physician)
templates     ──< procedures
procedures    ──< reports
procedures    ──< billing_codes
procedures    ──< procedure_images
procedures    ──< consents
users         ──< audit_logs
```

### 2.2 Table: `organizations`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| type | VARCHAR(100) | |
| address | TEXT | |
| phone | VARCHAR(20) | |
| emr_system | VARCHAR(100) | |
| subscription_plan | VARCHAR(50) | DEFAULT 'basic' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 2.3 Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| organization_id | UUID | FK → organizations, NOT NULL |
| specialty_id | UUID | FK → specialties, nullable |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | ENUM | physician \| nurse \| technician \| admin |
| is_active | BOOLEAN | DEFAULT true |
| last_login | TIMESTAMPTZ | |
| refresh_token | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 2.4 Table: `specialties`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| code | VARCHAR(20) | UNIQUE |
| description | TEXT | |
| is_active | BOOLEAN | DEFAULT true |

Seeded values: `GI` (Gastroenterology), `PULM` (Pulmonology), `CARD` (Cardiology)

### 2.5 Table: `patients`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| organization_id | UUID | FK → organizations, NOT NULL |
| mrn | VARCHAR(50) | UNIQUE per org |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| date_of_birth | DATE | NOT NULL |
| gender | VARCHAR(20) | |
| email | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| address | TEXT | |
| insurance_info | JSONB | DEFAULT '{}' |
| emr_id | VARCHAR(100) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes:** `(organization_id, mrn)` UNIQUE, `(last_name, first_name)`, `(mrn)`

### 2.6 Table: `templates`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| specialty_id | UUID | FK → specialties |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| fields | JSONB | NOT NULL, DEFAULT '[]' |
| is_active | BOOLEAN | DEFAULT true |
| version | INTEGER | DEFAULT 1 |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**JSONB `fields` element schema:**
```json
{
  "id": "uuid",
  "label": "Findings",
  "type": "textarea",
  "required": true,
  "order": 1,
  "options": ["option1", "option2"]
}
```
Supported `type` values: `text` | `textarea` | `checkbox` | `select` | `number` | `date` | `radio` | `image`

### 2.7 Table: `procedures`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| patient_id | UUID | FK → patients, NOT NULL |
| physician_id | UUID | FK → users, NOT NULL |
| template_id | UUID | FK → templates, nullable |
| specialty_id | UUID | FK → specialties, NOT NULL |
| organization_id | UUID | FK → organizations, NOT NULL |
| status | ENUM | draft \| in-progress \| completed \| signed |
| title | VARCHAR(255) | NOT NULL |
| procedure_date | DATE | NOT NULL |
| start_time | TIMESTAMPTZ | |
| end_time | TIMESTAMPTZ | |
| notes | TEXT | |
| findings | TEXT | |
| impression | TEXT | |
| complications | TEXT | |
| medications | JSONB | DEFAULT '[]' |
| equipment | JSONB | DEFAULT '[]' |
| documentation_data | JSONB | DEFAULT '{}' |
| quality_score | DECIMAL(5,2) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes:** `(patient_id)`, `(physician_id)`, `(organization_id, status)`, `(procedure_date DESC)`

**Status Workflow:**
```
draft → in-progress → completed → signed
         ↑ ← ← ← ← ↙
```
Valid transitions: `draft→in-progress`, `in-progress→completed`, `in-progress→draft`, `completed→signed`

### 2.8 Table: `reports`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| procedure_id | UUID | FK → procedures |
| type | VARCHAR(50) | CHECK IN ('pdf','hl7','structured') |
| content | TEXT | |
| file_path | VARCHAR(500) | |
| generated_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |

### 2.9 Table: `billing_codes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| procedure_id | UUID | FK → procedures |
| cpt_code | VARCHAR(20) | |
| icd_code | VARCHAR(20) | |
| description | TEXT | |
| amount | DECIMAL(10,2) | |
| status | VARCHAR(50) | DEFAULT 'suggested' CHECK IN ('suggested','confirmed','billed') |
| created_at | TIMESTAMPTZ | |

### 2.10 Table: `audit_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(100) | |
| entity_id | UUID | |
| ip_address | VARCHAR(45) | |
| user_agent | TEXT | |
| details | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | |

**Indexes:** `(user_id)`, `(entity_type, entity_id)`, `(created_at DESC)`

### 2.11 Table: `consents`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| patient_id | UUID | FK → patients |
| procedure_id | UUID | FK → procedures, nullable |
| consent_type | VARCHAR(100) | NOT NULL |
| signature_data | TEXT | |
| signed_at | TIMESTAMPTZ | |
| witness_id | UUID | FK → users, nullable |
| is_valid | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | |

### 2.12 Table: `procedure_images`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| procedure_id | UUID | FK → procedures |
| file_path | VARCHAR(500) | NOT NULL |
| file_name | VARCHAR(255) | |
| file_size | INTEGER | |
| mime_type | VARCHAR(100) | |
| annotation | JSONB | DEFAULT '{}' |
| captured_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_at | TIMESTAMPTZ | |

---

## 3. API Specification

All endpoints are prefixed with `/api`. All protected routes require:
```
Authorization: Bearer <access_token>
```

### 3.1 Standard Response Envelopes

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": [{ "field": "email", "message": "Invalid email" }]
}
```

---

### 3.2 Auth Endpoints — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login, returns JWT pair |
| POST | `/logout` | Yes | Invalidate refresh token |
| POST | `/refresh` | No | Exchange refresh → access token |
| GET | `/profile` | Yes | Get current user profile |
| PUT | `/profile` | Yes | Update name/profile fields |
| PUT | `/change-password` | Yes | Change password |

**POST /login Request:**
```json
{ "email": "doctor@hospital.com", "password": "SecurePass@123" }
```
**POST /login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "doctor@hospital.com", "role": "physician", "firstName": "John", "lastName": "Smith" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 86400
  }
}
```

---

### 3.3 Patient Endpoints — `/api/patients`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | All | List patients (paginated, searchable) |
| POST | `/` | admin, physician | Create patient |
| GET | `/:id` | All | Get patient by ID |
| PUT | `/:id` | admin, physician | Update patient |
| DELETE | `/:id` | admin | Soft delete patient |
| GET | `/:id/procedures` | All | Patient procedure history |

**GET / Query Params:** `page`, `limit`, `search` (name/MRN), `gender`, `sortBy`, `sortOrder`

---

### 3.4 Procedure Endpoints — `/api/procedures`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | All | List procedures (filterable) |
| POST | `/` | physician, nurse, admin | Create procedure |
| GET | `/by-patient/:patientId` | All | Procedures by patient |
| GET | `/by-physician/:physicianId` | All | Procedures by physician |
| GET | `/:id` | All | Get full procedure with relations |
| PUT | `/:id` | physician, nurse, admin | Update procedure |
| DELETE | `/:id` | admin | Delete procedure |
| PATCH | `/:id/status` | physician, admin | Status transition |
| POST | `/:id/auto-save` | physician, nurse | Save draft data silently |
| POST | `/:id/images` | All | Upload procedure image (multipart) |
| DELETE | `/:id/images/:imageId` | physician, admin | Remove image |

**GET / Query Params:** `page`, `limit`, `status`, `specialtyId`, `physicianId`, `startDate`, `endDate`

---

### 3.5 Template Endpoints — `/api/templates`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | All | List templates (filterable) |
| POST | `/` | admin | Create template |
| GET | `/specialty/:specialtyId` | All | Templates for a specialty |
| GET | `/:id` | All | Get template with fields |
| PUT | `/:id` | admin | Update template (increments version) |
| DELETE | `/:id` | admin | Deactivate template |
| POST | `/:id/clone` | admin | Clone template |

---

### 3.6 Report Endpoints — `/api/reports`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate` | Generate PDF or HL7 report for a procedure |
| GET | `/procedure/:procedureId` | All reports for a procedure |
| GET | `/:id/download` | Stream file download |

**POST /generate Request:**
```json
{ "procedureId": "uuid", "type": "pdf" }
```

---

### 3.7 Billing Endpoints — `/api/billing`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/suggestions/:procedureId` | CPT/ICD code suggestions based on specialty |
| POST | `/` | Confirm/add a billing code |
| GET | `/procedure/:procedureId` | All billing codes for procedure |
| PUT | `/:id` | Update billing code status |

---

### 3.8 Analytics Endpoints — `/api/analytics`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Stats summary: counts, avg quality, recent procedures |
| GET | `/procedures` | Volume by month, by specialty, by status |
| GET | `/quality` | Quality score averages by specialty |
| GET | `/completion-rates` | Completion and signing rates |

---

### 3.9 Compliance Endpoints — `/api/compliance`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/audit-log` | admin | Paginated audit trail with filters |
| POST | `/report` | admin | Generate compliance summary report |
| GET | `/audit-trail/:entityType/:entityId` | admin, physician | All audit events for an entity |

---

## 4. Authentication & Security

### 4.1 JWT Strategy
| Token | Expiry | Payload |
|-------|--------|---------|
| Access token | 24h | `{ id, email, role, orgId }` |
| Refresh token | 7d | `{ id }`, stored in DB `users.refresh_token` |

On logout, `refresh_token` is set to `NULL` in the database.

### 4.2 Role-Based Access Control

| Role | Level | Capabilities |
|------|-------|-------------|
| admin | 4 | Full access to all resources and admin endpoints |
| physician | 3 | Own procedures + all patients in org |
| nurse | 2 | Assigned procedure documentation |
| technician | 1 | Read-only access |

### 4.3 Rate Limiting
- General API: 200 requests / 15 min per IP
- Auth endpoints (login/register): 10 requests / 15 min per IP

### 4.4 Security Headers (helmet)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

---

## 5. Real-time (Socket.io)

Socket.io namespace: default `/`

| Event (server → client) | Payload | Description |
|--------------------------|---------|-------------|
| `procedure:update` | `{ procedureId, updatedAt }` | Procedure data changed |
| `procedure:status_change` | `{ procedureId, status }` | Status transitioned |
| `notification:new` | `{ message, type }` | User notification |

Rooms: each organization has a room named by `organizationId`. Clients join via `socket.emit('join:org', orgId)`.

---

## 6. File Storage

```
uploads/
├── procedures/
│   └── {procedureId}/
│       └── {timestamp}-{filename}
└── reports/
    └── report_{procedureId}_{timestamp}.pdf
```

- Max file size: 10 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `application/pdf`
- Files served statically at `/uploads/*`

---

## 7. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` \| `production` |
| `PORT` | No | Server port (default 3000) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | No | PostgreSQL port (default 5432) |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | Min 32 chars |
| `JWT_EXPIRES_IN` | No | Default `24h` |
| `REFRESH_TOKEN_SECRET` | Yes | Min 32 chars |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Default `7d` |
| `UPLOAD_PATH` | No | Default `./uploads` |
| `MAX_FILE_SIZE` | No | Bytes, default `10485760` |
| `CORS_ORIGIN` | No | Default `http://localhost:4200` |
| `SPEECH_TO_TEXT_API_KEY` | No | For voice-to-text feature |

---

## 8. Project Structure

```
backend/
├── server.js                    ← Entry point
├── package.json
├── .env.example
└── src/
    ├── config/
    │   ├── app.js               ← Config object from env vars
    │   └── database.js          ← Sequelize instance + connectDB()
    ├── models/
    │   ├── index.js             ← All associations
    │   ├── Organization.js
    │   ├── User.js              ← bcrypt hooks, validatePassword()
    │   ├── Patient.js
    │   ├── Procedure.js
    │   ├── Template.js
    │   ├── Specialty.js
    │   ├── Report.js
    │   ├── AuditLog.js
    │   ├── BillingCode.js
    │   ├── Consent.js
    │   └── ProcedureImage.js
    ├── controllers/
    │   ├── authController.js
    │   ├── patientController.js
    │   ├── procedureController.js
    │   ├── templateController.js
    │   ├── reportController.js
    │   ├── billingController.js
    │   ├── analyticsController.js
    │   └── complianceController.js
    ├── routes/
    │   ├── index.js             ← Mounts all routers
    │   ├── auth.js
    │   ├── patients.js
    │   ├── procedures.js        ← Includes multer file upload
    │   ├── templates.js
    │   ├── reports.js
    │   ├── billing.js
    │   ├── analytics.js
    │   └── compliance.js
    ├── middleware/
    │   ├── auth.js              ← JWT verification → req.user
    │   ├── rbac.js              ← authorize(...roles) factory
    │   └── audit.js             ← auditLog(action, entityType) factory
    └── database/
        ├── migrations/          ← Raw SQL (001–011)
        └── seed.js              ← Demo data seeder
```

---

## 9. Setup & Running

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secrets

# 3. Create PostgreSQL database
createdb procedureflow

# 4. Sync schema (auto via Sequelize in development)
npm run dev     # starts with nodemon, auto-syncs schema

# 5. Seed demo data (optional)
npm run seed

# 6. Production start
npm start
```

**Health check:** `GET http://localhost:3000/api/health`

---

## 10. Key Business Rules

1. **Organization isolation:** All queries filter by `organizationId` from the authenticated user's JWT. Users cannot access data from other organizations.
2. **Password hashing:** Passwords are bcrypt-hashed (cost 12) via Sequelize `beforeCreate`/`beforeUpdate` hooks.
3. **Status transitions are validated:** Invalid transitions return HTTP 400 with a descriptive error.
4. **Auto-save is silent:** `POST /procedures/:id/auto-save` always returns 200 even on non-critical errors to avoid disrupting the user's workflow.
5. **Soft deletes for templates:** Templates are deactivated (`isActive = false`) rather than hard-deleted to preserve procedure history.
6. **Audit logging:** All write operations (CREATE, UPDATE, DELETE, STATUS_CHANGE) are logged to `audit_logs` asynchronously.
7. **Token refresh:** On 401, the client should POST to `/auth/refresh` with the stored refresh token. If that also fails, the user is logged out.
