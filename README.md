# i-SOFTZONE — Employee Management System

A comprehensive full-stack Employee Management System built with React, Node.js, Express, and PostgreSQL. Features include employee CRUD, leave management, payroll, attendance tracking, asset management, executive dashboards, and data export capabilities.

---

## 🚀 Live Deployment

| Layer    | URL |
|----------|-----|
| Frontend | [Vercel](https://login-app-e4zw.vercel.app) |
| Backend  | [Render](https://login-app-latest-kmpt.onrender.com) |
| Database | Neon PostgreSQL (Cloud) |

---

## ✨ Features

### Authentication & Security
- JWT-based authentication with access + refresh tokens
- Bcrypt password hashing
- Role-based access control (Admin, Manager, HR, Employee)
- Email verification & password reset
- Rate limiting & Helmet security headers

### Employee Management
- Full CRUD operations for employee records
- Employee profiles with department, designation, salary, skills
- Profile picture uploads
- Advanced search & filtering

### Leave Management
- Multi-level approval workflow (Manager → HR → Final)
- Leave types: Casual, Sick, Earned, Maternity
- Leave balance tracking
- Approval history with remarks

### Payroll Management
- Salary structure: Basic, HRA, DA, Bonus
- Deductions: TDS, ESI, PF
- Monthly payroll dashboard
- Payslip generation & export

### Attendance Tracking
- Daily clock-in/clock-out
- Attendance status tracking (Present, Absent, Late, Half Day)
- Monthly attendance reports

### Asset Management
- Asset registration with codes and types
- Allocation to employees
- Return tracking & asset history

### Analytics & Dashboards
- **Executive Dashboard**: Employee growth trends, payroll trends, performance distribution, gender diversity charts
- **Manager Insights**: Top performers, highest paid, most leaves, recent joiners
- **Department Dashboards**: Per-department analytics (headcount, avg salary, performance)

### Reports & Export
- Employee, Payroll, Attendance, and Performance reports
- Export to PDF, CSV, and Excel formats
- Filter by department, date range, and more

### Other Features
- Global search across employees
- Dark/Light theme toggle
- Real-time notifications
- SQL Joins demo page
- Smooth page transitions with Framer Motion

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI Library |
| Vite 7 | Build Tool |
| React Router DOM 7 | Client-side Routing |
| Redux Toolkit | State Management |
| Axios | HTTP Client |
| Recharts | Data Visualization |
| Framer Motion | Animations |
| Lucide React | Icons |
| React Hot Toast | Notifications |
| jsPDF + AutoTable | PDF Export |
| SheetJS (xlsx) | Excel Export |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express 5 | Web Framework |
| PostgreSQL | Database |
| JWT | Authentication |
| Bcrypt | Password Hashing |
| Multer | File Uploads |
| Helmet | Security Headers |
| Express Rate Limit | Rate Limiting |
| Winston | Logging |
| Nodemailer | Email Service |
| PDFKit | Server-side PDF |
| Swagger UI | API Documentation |

---

## 📁 Project Structure

```
LoginApp/
├── backend/
│   ├── config/          # Database config & initialization
│   ├── middleware/       # Auth & error handling middleware
│   ├── routes/          # Express route handlers
│   ├── src/
│   │   ├── controllers/ # Business logic controllers
│   │   ├── routes/      # Advanced module routes
│   │   ├── services/    # Service layer
│   │   ├── repositories/# Data access layer
│   │   └── validators/  # Input validation schemas
│   ├── utils/           # Logger, mailer utilities
│   ├── uploads/         # User file uploads
│   ├── server.js        # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   ├── redux/       # Redux store & slices
│   │   ├── api.js       # Axios instance & interceptors
│   │   ├── App.jsx      # Root app with routing
│   │   ├── main.jsx     # Entry point
│   │   └── styles.css   # Global styles
│   ├── vercel.json      # Vercel SPA routing config
│   ├── vite.config.js   # Vite build config
│   └── package.json
│
├── render.yaml          # Render deployment config
├── .gitignore
└── README.md
```

---

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (local or Neon cloud)
- npm package manager

### 1. Clone the repository
```bash
git clone https://github.com/rishixh0520/login-app.git
cd login-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loginapp_db
JWT_SECRET=your_jwt_secret_key
PORT=5000

# For cloud database (Neon), use DATABASE_URL instead:
# DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# Optional: Email configuration
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-gmail-app-password
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Run the Application
```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & get JWT tokens |
| POST | `/api/auth/logout` | Logout & invalidate refresh token |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/verify-email/:token` | Verify email address |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/:id` | Get employee details |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Leaves
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaves` | List leave applications |
| POST | `/api/leaves/apply` | Apply for leave |
| PUT | `/api/leaves/:id/approve` | Approve leave |
| PUT | `/api/leaves/:id/reject` | Reject leave |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll` | List salary records |
| POST | `/api/payroll/generate` | Generate salary |
| GET | `/api/payroll/dashboard` | Payroll dashboard stats |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List all assets |
| POST | `/api/assets` | Create asset |
| POST | `/api/assets/allocate` | Allocate asset |
| POST | `/api/assets/return` | Return asset |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance records |
| POST | `/api/attendance/clock-in` | Clock in |
| POST | `/api/attendance/clock-out` | Clock out |

### Analytics & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/executive` | Executive dashboard data |
| GET | `/api/analytics/department/:id` | Department analytics |
| GET | `/api/analytics/manager-insights` | Manager insights data |
| GET | `/api/advanced-reports` | Advanced reports data |
| GET | `/api/search` | Global search |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/departments` | List departments |
| GET | `/api/skills` | List skills |
| GET | `/api/notifications` | User notifications |

---

## 🔐 Environment Variables

### Backend (Render)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Vercel frontend URL |
| `EMAIL_USER` | Gmail address (optional) |
| `EMAIL_PASS` | Gmail App Password (optional) |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Render backend URL |

---

## 🧑‍💻 Developer

**Rishi Dhakad**
- GitHub: [@rishixh0520](https://github.com/rishixh0520)
- Email: rishixh0520@gmail.com

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
