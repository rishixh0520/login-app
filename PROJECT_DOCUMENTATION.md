# i-SOFTZONE Employee Management System
## Project Documentation

---

## 1. Project Overview

**i-SOFTZONE Employee Management System** is a comprehensive full-stack web application designed to streamline human resource operations for small to mid-sized organizations. It provides a centralized platform for managing employees, leaves, payroll, attendance, assets, and generating insightful analytics.

### Objective
To build a production-ready, cloud-deployed Employee Management System demonstrating full-stack development skills with React frontend, Node.js/Express backend, and PostgreSQL database.

### Scope
- User authentication with role-based access control
- Complete employee lifecycle management
- Leave workflow with multi-level approvals
- Payroll processing with salary components
- Attendance tracking with clock-in/clock-out
- Asset management with allocation tracking
- Executive & department-level analytics dashboards
- Report generation and export (PDF, CSV, Excel)

---

## 2. Modules

### 2.1 Authentication Module
- **Signup**: User registration with input validation (Joi)
- **Login**: JWT access token (15min) + refresh token (30 days)
- **Logout**: Refresh token invalidation
- **Forgot Password**: Email-based password reset with token
- **Email Verification**: Token-based email verification
- **Role-Based Access**: Admin, Manager, HR, Employee roles

### 2.2 Employee Module
- Create, Read, Update, Delete employee records
- Employee profiles: personal info, department, designation, salary
- Skill tagging with many-to-many relationships
- Profile picture upload (Multer)
- Advanced search and filtering

### 2.3 Leave Module
- Leave types: Casual (12), Sick (10), Earned (15), Maternity (90)
- Application workflow: Employee → Manager → HR → Final
- Leave balance tracking
- Approval history with remarks
- Status tracking: pending_manager, pending_hr, approved, rejected

### 2.4 Payroll Module
- Salary components: Basic, HRA (40%), DA (20%), Bonus
- Deductions: TDS (10%), ESI (0.75%), PF (12%)
- Monthly payroll generation
- Payroll dashboard with statistics
- Employee payslip view

### 2.5 Attendance Module
- Daily clock-in / clock-out
- Status: Present, Absent, Late, Half Day
- Monthly attendance summary
- Attendance reports

### 2.6 Asset Module
- Asset registration with unique codes
- Asset types: Laptop, Monitor, Mouse, etc.
- Allocation to employees
- Return tracking
- Asset history audit trail

### 2.7 Analytics Module
- **Executive Dashboard**: 
  - Employee growth trend (yearly hires)
  - Payroll trend (monthly totals)
  - Performance distribution
  - Gender diversity ratio
  - Department headcount
- **Manager Insights**: Top performers, highest paid, most leaves, recent joiners
- **Department Dashboards**: Per-department metrics (headcount, avg salary, avg performance)

### 2.8 Reports Module
- Employee reports with filters
- Payroll reports by month
- Attendance reports by date range
- Export formats: PDF (jsPDF), CSV, Excel (SheetJS)

### 2.9 Notifications Module
- System-generated notifications for key events
- Read/unread status
- Real-time notification badge

### 2.10 Master Data Module
- Department management (CRUD)
- Skills management (CRUD)
- Leave type configuration

---

## 3. Database Design

### Entity-Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users      │────▶│ employee_profiles │────▶│ departments  │
│              │     │                  │     │              │
│ id (PK)      │     │ id (PK)          │     │ id (PK)      │
│ name         │     │ user_id (FK)     │     │ dept_name    │
│ email (UQ)   │     │ department_id(FK)│     └──────────────┘
│ password     │     │ phone, address   │
│ role         │     │ designation      │     ┌──────────────┐
│ verified     │     │ salary, gender   │     │   skills     │
└──────┬───────┘     │ performance      │     │              │
       │             │ join_date        │     │ id (PK)      │
       │             └────────┬─────────┘     │ skill_name   │
       │                      │               └──────┬───────┘
       │                      │                      │
       │              ┌───────▼────────┐    ┌────────▼───────┐
       │              │employee_skills  │    │  (join table)  │
       │              │ employee_id(FK) │    │                │
       │              │ skill_id (FK)   │    └────────────────┘
       │              └────────────────┘
       │
  ┌────▼──────────┐   ┌─────────────────┐   ┌──────────────┐
  │refresh_tokens  │   │leave_applications│   │ leave_types  │
  │ user_id (FK)  │   │ employee_id(FK) │   │ id (PK)      │
  │ token         │   │ leave_type(FK)  │   │ leave_name   │
  └───────────────┘   │ from/to_date    │   │ total_days   │
                      │ status          │   └──────────────┘
  ┌───────────────┐   └────────┬────────┘
  │password_reset  │            │          ┌──────────────────┐
  │ user_id (FK)  │   ┌────────▼────────┐ │  leave_balance   │
  │ token         │   │approval_history  │ │ employee_id(FK)  │
  │ expires_at    │   │ leave_id (FK)   │ │ leave_type(FK)   │
  └───────────────┘   │ approved_by(FK) │ │ available_days   │
                      │ action, remarks │ └──────────────────┘
                      └─────────────────┘

  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
  │   assets      │   │asset_allocations │   │ asset_history │
  │ id (PK)      │──▶│ asset_id (FK)    │   │ asset_id(FK) │
  │ asset_code   │   │ employee_id(FK)  │   │ action       │
  │ asset_name   │   │ allocated_by(FK) │   │ remarks      │
  │ asset_type   │   │ allocated_date   │   │ created_by   │
  │ status       │   │ return_date      │   └──────────────┘
  └──────────────┘   └──────────────────┘

  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
  │  attendance   │   │    salaries      │   │notifications │
  │ employee_id  │   │ employee_id(FK)  │   │ user_id(FK)  │
  │ date         │   │ salary_month     │   │ title        │
  │ clock_in/out │   │ basic, hra, da   │   │ message      │
  │ status       │   │ tds, esi, pf     │   │ is_read      │
  └──────────────┘   │ net_salary       │   └──────────────┘
                     └──────────────────┘

  ┌──────────────────┐
  │   audit_logs      │
  │ table_name       │
  │ action_type      │
  │ old_data (JSONB) │
  │ new_data (JSONB) │
  │ performed_by(FK) │
  └──────────────────┘
```

### Tables Summary

| # | Table | Purpose | Key Relationships |
|---|-------|---------|-------------------|
| 1 | `users` | User accounts & auth | Base entity |
| 2 | `employee_profiles` | Employee details | FK → users, departments |
| 3 | `departments` | Department master | Referenced by profiles |
| 4 | `skills` | Skill master | Referenced via join table |
| 5 | `employee_skills` | Employee-skill mapping | FK → profiles, skills |
| 6 | `employee_images` | Profile pictures | FK → profiles |
| 7 | `leave_types` | Leave type config | Referenced by applications |
| 8 | `leave_balance` | Per-employee leave balance | FK → profiles, leave_types |
| 9 | `leave_applications` | Leave requests | FK → profiles, leave_types |
| 10 | `approval_history` | Leave approval trail | FK → applications, users |
| 11 | `assets` | Asset registry | Referenced by allocations |
| 12 | `asset_allocations` | Asset-employee mapping | FK → assets, profiles |
| 13 | `asset_history` | Asset audit trail | FK → assets, users |
| 14 | `attendance` | Daily attendance | FK → profiles |
| 15 | `salaries` | Monthly payroll | FK → profiles |
| 16 | `notifications` | User notifications | FK → users |
| 17 | `audit_logs` | System audit trail | FK → users |
| 18 | `refresh_tokens` | JWT refresh tokens | FK → users |
| 19 | `password_reset` | Password reset tokens | FK → users |

### Database Views
- **`employee_summary`**: Joins users + employee_profiles + departments for quick lookups

### Stored Functions
- **`calculate_leave_balance(emp_id, leave_type_id)`**: Returns available leave balance for an employee

---

## 4. API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | No | Register new user |
| POST | `/login` | No | Login, returns JWT tokens |
| POST | `/logout` | No | Invalidate refresh token |
| POST | `/refresh-token` | No | Get new access token |
| GET | `/verify-email/:token` | No | Verify email |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password |

### Employees (`/api/employees`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List all employees |
| GET | `/:id` | Yes | Get employee by ID |
| POST | `/` | Yes (Admin/HR) | Create employee |
| PUT | `/:id` | Yes (Admin/HR) | Update employee |
| DELETE | `/:id` | Yes (Admin) | Delete employee |

### Leaves (`/api/leaves`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List applications |
| POST | `/apply` | Yes | Apply for leave |
| PUT | `/:id/approve` | Yes (Mgr/HR) | Approve leave |
| PUT | `/:id/reject` | Yes (Mgr/HR) | Reject leave |

### Payroll (`/api/payroll`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List salary records |
| POST | `/generate` | Yes (Admin/HR) | Generate salary |
| GET | `/dashboard` | Yes | Payroll stats |
| GET | `/my-salary` | Yes | Employee's own salary |

### Assets (`/api/assets`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List assets |
| POST | `/` | Yes (Admin) | Create asset |
| POST | `/allocate` | Yes (Admin/Mgr) | Allocate asset |
| POST | `/return` | Yes (Admin/Mgr) | Return asset |

### Attendance (`/api/attendance`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List records |
| POST | `/clock-in` | Yes | Clock in |
| POST | `/clock-out` | Yes | Clock out |

### Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/executive` | Yes | Executive dashboard |
| GET | `/department/:id` | Yes | Department analytics |
| GET | `/manager-insights` | Yes (Mgr+) | Manager insights |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/departments` | Yes | List departments |
| GET | `/api/skills` | Yes | List skills |
| GET | `/api/notifications` | Yes | User notifications |
| GET | `/api/search` | Yes | Global search |
| GET | `/api/advanced-reports` | Yes | Advanced reports |

---

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
└───────────┬────────────────────────────┬────────────────┘
            │                            │
    ┌───────▼───────┐           ┌────────▼────────┐
    │   VERCEL       │           │    RENDER        │
    │   (Frontend)   │──HTTPS──▶│    (Backend)     │
    │                │           │                  │
    │  React SPA     │           │  Express API     │
    │  Vite Build    │           │  Node.js         │
    │  Static Files  │           │  Winston Logs    │
    └────────────────┘           └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │  NEON PostgreSQL  │
                                 │  (Cloud Database) │
                                 │                   │
                                 │  19 Tables        │
                                 │  1 View           │
                                 │  1 Function       │
                                 └───────────────────┘
```

### Deployment URLs

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://login-app-e4zw.vercel.app | Vercel |
| Backend API | https://login-app-latest-kmpt.onrender.com | Render |
| API Docs | https://login-app-latest-kmpt.onrender.com/api-docs | Swagger UI |
| Database | Neon PostgreSQL | Neon |

### Environment Variables

**Render (Backend)**:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — Auto-generated secret key
- `NODE_ENV` — `production`
- `FRONTEND_URL` — Vercel frontend URL

**Vercel (Frontend)**:
- `VITE_API_BASE_URL` — Render backend URL

---

## 6. Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | Bcrypt (10 salt rounds) |
| JWT Tokens | Access (15min) + Refresh (30 days) |
| CORS | Origin whitelist + domain pattern matching |
| Rate Limiting | 2000 requests per 15 min per IP |
| Helmet | Security headers (CSP, XSS, etc.) |
| Input Validation | Joi schemas for all inputs |
| SQL Injection | Parameterized queries (pg driver) |
| File Upload | Multer with validation |

---

## 7. Screenshots

> Add your application screenshots here:
> - Login Page
> - Executive Dashboard
> - Employee List
> - Leave Management
> - Payroll Dashboard
> - Asset Management
> - Attendance Tracking
> - Reports Export
> - Dark Mode

---

## 8. Future Enhancements

1. **Mobile Application** — React Native companion app
2. **Real-time Notifications** — WebSocket-based push notifications
3. **AI Analytics** — Predictive analytics for attrition & performance
4. **Biometric Attendance** — Integration with biometric devices
5. **Document Management** — Employee document storage (offer letters, certificates)
6. **Performance Reviews** — Quarterly review cycles with goal tracking
7. **Training Module** — Employee training management & certifications
8. **Multi-tenant** — Support for multiple organizations
9. **Audit Dashboard** — Visual audit log explorer
10. **Two-Factor Authentication** — SMS/Authenticator based 2FA

---

## 9. Developer

**Rishi Dhakad**
- GitHub: [@rishixh0520](https://github.com/rishixh0520)
- Email: rishixh0520@gmail.com

---

*Document Version: 1.0 | Last Updated: June 2026*
