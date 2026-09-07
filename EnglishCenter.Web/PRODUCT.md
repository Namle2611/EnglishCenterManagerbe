# Product Truth: English Center Management System (EnglishCenter.Web)

## 1. Product Context
**EnglishCenter.Web** is a dedicated web application for administrative and operational management of a language learning center (English Center). It is a role-based business productivity SaaS application—not a marketing website or consumer portal.

## 2. Core Personas & Roles
- **ADMIN**:
  - Full authority over institutional operations.
  - Modules: Dashboard (`/admin`), Student Management (`/admin/students`), Teacher Management (`/admin/teachers`), Course Management (`/admin/courses`).
  - Capable of creating, viewing, editing, and updating statuses of students, teachers, and courses.
- **STAFF**:
  - Operational staff supporting student enrollment and course logistics.
  - Modules: Dashboard (`/staff`), Student Management (`/staff/students`), Course Management (`/staff/courses`).
  - Authorization boundary: Strictly blocked from Teacher Management (`/admin/teachers` -> 403 Access Denied).
- **TEACHER**:
  - Academic teaching staff.
  - Modules: Teacher Portal (`/teacher`), profile/status overview.
  - Blocked from administrative management endpoints.
- **STUDENT**:
  - Enrolled learners.
  - Modules: Student Portal (`/student`), enrollment/overview.
  - Blocked from administrative management endpoints.

## 3. Architecture & Functional Constraints (FROZEN)
- **Backend Freeze**: `EnglishCenter.Api` is 100% frozen. 0 backend files modified, 0 new EF Core migrations, 1 initial migration, 26 business tables.
- **API Contracts Freeze**: All REST endpoints (`/api/auth/*`, `/api/students/*`, `/api/teachers/*`, `/api/courses/*`), request payloads, and response structures remain identical.
- **Routing & Role Isolation Freeze**:
  - RoleRoute enforces frontend route boundaries.
  - Prefix isolation (`/admin/*` vs `/staff/*`) produces a 403 Access Denied screen upon mismatch; no auto-redirecting across role boundaries.
- **Business Logic Freeze**:
  - `StudentCode`, `TeacherCode`, `CourseCode` are immutable once created.
  - `EnrollmentDate` is immutable for students.
  - Teacher passwords have a create-only memory lifecycle (cleared from state, never requested on edit).
  - `TuitionFee` is handled as a raw decimal string in form state and JSON payload to prevent floating-point precision loss.
  - `DurationMonths` must be a strictly positive integer (> 0).
  - `ExperienceYears` allows 0 as valid experience.
  - Status updates are segregated into dedicated non-optimistic PATCH mutations with explicit user confirmation.
- **Query & URL State Freeze**:
  - URL query parameters (`page`, `pageSize`, `search`, `status`, `sortBy`, `sortDirection`, `currentLevel`) are preserved across reloads and browser history.
  - `AbortController` cancellation protects search/filter queries from stale overwrites.

## 4. Visual & UX Direction
- Modern, clean, authoritative education management SaaS.
- Zero fake metrics, zero fake revenue, zero artificial charts.
- Clear app shell: unified sidebar navigation, context-rich topbar, breadcrumbs, high-density scannable data tables with `tabular-nums` alignment, and structured form cards.
