# HealthCart — Fullstack Health Appointment Booking System (Next.js)

A complete, production-grade full-stack healthcare appointment booking platform built entirely in **Next.js 14 (App Router)** with real-time slot generation, conflict-safe booking, role-based access, and analytics.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | **Next.js 14** (App Router, Unified Fullstack: React + API Route Handlers) |
| **Styling** | Tailwind CSS + Lucide Icons + Recharts |
| **Database** | MongoDB Atlas + Prisma ORM (singleton client for serverless/HMR) |
| **Authentication** | JWT (access & refresh tokens with auto-refresh interceptors), bcryptjs |
| **Notifications** | In-app DB notifications + Nodemailer (Gmail SMTP or Ethereal in dev) |
| **Validation** | Zod on all API inputs and client payloads |
| **Scheduling Core**| Pure conflict-free slot generation algorithm with leave & grid alignment |

---

## 📁 Project Structure

```
HealthCart booking system/
├── prisma/
│   ├── schema.prisma           # MongoDB database schema
│   └── seed.js                 # Seed script with demo doctors, patients & admin
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/                # Fullstack API Route Handlers
│   │   │   ├── auth/           # /api/auth (register, login, refresh, logout, me)
│   │   │   ├── doctors/        # /api/doctors, specializations, slots, availability
│   │   │   ├── appointments/   # /api/appointments (book, cancel, reschedule, status)
│   │   │   ├── waitlist/       # /api/waitlist (join, view, cancel)
│   │   │   ├── notifications/  # /api/notifications (list, read, read-all)
│   │   │   ├── admin/          # /api/admin (users, doctors, analytics)
│   │   │   └── health/         # /api/health
│   │   ├── admin/              # Admin dashboard, user & doctor management
│   │   ├── doctor/             # Doctor dashboard, availability & appointments
│   │   ├── patient/            # Patient search, booking & appointments
│   │   ├── login/              # Login with demo accounts quick-fill
│   │   ├── register/           # Patient & Doctor registration
│   │   ├── notifications/      # Real-time notifications page
│   │   ├── layout.tsx          # Root layout with Toast & AuthProvider
│   │   └── page.tsx            # Modern landing page
│   ├── components/             # Reusable UI components & layouts
│   ├── context/                # AuthContext (state, tokens, auto-refresh)
│   └── lib/                    # Core libraries & backend services
│       ├── api.ts              # Unified Axios client (relative /api with token refresh)
│       ├── auth.ts             # Auth utilities (JWT verify, role guards, response helpers)
│       ├── config.ts           # Central environment configuration
│       ├── prisma.ts           # Global Prisma client singleton
│       ├── validators/         # Zod schemas for all models & requests
│       └── services/           # Backend services
│           ├── slotService.ts  # Slot algorithm & conflict checker
│           ├── bookingService.ts # Concurrency-safe booking, waitlist & cancellation
│           ├── notificationService.ts # In-app notification creation
│           └── mailer.ts       # Nodemailer SMTP with HTML templates
├── .env                        # Environment variables (Database, JWT, SMTP)
├── .env.local                  # Local overrides (optional)
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind theme and custom animations
├── tsconfig.json               # TypeScript configuration
└── package.json                # Single unified fullstack package
```

---

## ⚡ Quick Start

### 1. Setup Environment

Verify your `.env` or `.env.local` in the project root:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/drappointment?appName=Cluster0"

JWT_SECRET="healthcart-super-secret-jwt-key-2024-change-in-prod"
JWT_REFRESH_SECRET="healthcart-refresh-secret-jwt-key-2024-change-in-prod"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
NODE_ENV="development"

# Email (Gmail SMTP or Ethereal)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="HealthCart <noreply@healthcart.com>"

# Scheduling
DEFAULT_SLOT_DURATION_MINUTES=30
CANCELLATION_CUTOFF_HOURS=24
```

### 2. Install Dependencies & Generate Prisma

```bash
npm install
npx prisma generate
```

### 3. Sync Database & Seed Demo Data

```bash
# Push schema to MongoDB Atlas
npx prisma db push

# Seed demo doctors, patients, and admin
npm run seed
```

### 4. Start Fullstack Next.js Server

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser!

Both the frontend web app and the full `/api/*` endpoints run simultaneously on port 3000 without requiring any separate server processes or CORS configuration.

---

## 🔑 Demo Accounts

Use these pre-seeded accounts to explore the system:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@healthcart.com` | `Admin@123` |
| **Doctor (Cardiology)** | `priya.sharma@healthcart.com` | `Doctor@123` |
| **Doctor (Orthopedics)** | `arjun.mehta@healthcart.com` | `Doctor@123` |
| **Doctor (Dermatology)** | `meera.nair@healthcart.com` | `Doctor@123` |
| **Patient** | `rahul@example.com` | `Patient@123` |
| **Patient** | `sunita@example.com` | `Patient@123` |
| **Patient** | `amir@example.com` | `Patient@123` |

> Quick-fill demo credentials are also available on the **`/login`** page.

---

## 📋 Fullstack API Reference

All routes are implemented as native Next.js Route Handlers under `/api`:

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new patient or doctor account
- `POST /api/auth/login` — Sign in and receive access + refresh JWTs
- `POST /api/auth/refresh` — Rotate refresh token and get a new access token
- `POST /api/auth/logout` — Revoke refresh token and invalidate session
- `GET  /api/auth/me` — Retrieve the current user's profile and doctor details

### 🩺 Doctors & Availability (`/api/doctors`)
- `GET    /api/doctors` — Search and filter active doctors (by specialization, name, pagination)
- `GET    /api/doctors/specializations` — List distinct medical specializations
- `GET    /api/doctors/me` — Doctor retrieves their own profile, schedule, and leaves
- `GET    /api/doctors/:id` — View a specific doctor's profile and schedule
- `PUT    /api/doctors/:id` — Update doctor profile (fees, bio, experience, approval flag)
- `GET    /api/doctors/:id/slots?date=YYYY-MM-DD` — Real-time computed available slots
- `GET    /api/doctors/:id/availability` — List recurring weekly availability windows
- `POST   /api/doctors/:id/availability` — Add availability window
- `PUT    /api/doctors/:id/availability/:availId` — Update availability window
- `DELETE /api/doctors/:id/availability/:availId` — Remove availability window
- `GET    /api/doctors/:id/availability/leaves` — List upcoming doctor leaves
- `POST   /api/doctors/:id/availability/leaves` — Schedule a leave day
- `DELETE /api/doctors/:id/availability/leaves/:leaveId` — Cancel leave day

### 📅 Appointments (`/api/appointments`)
- `GET   /api/appointments` — Role-scoped list (Patient: own; Doctor: patient bookings; Admin: all)
- `POST  /api/appointments` — Conflict-safe atomic slot booking with auto-notifications
- `GET   /api/appointments/:id` — Detailed appointment view
- `PATCH /api/appointments/:id/cancel` — Cancel appointment (with 24h cutoff check + waitlist notify)
- `PATCH /api/appointments/:id/reschedule` — Atomic reschedule to a new slot
- `PATCH /api/appointments/:id/status` — Doctor/Admin update status (`CONFIRMED`, `COMPLETED`, `NO_SHOW`, etc.)

### ⏳ Waitlist (`/api/waitlist`)
- `POST   /api/waitlist` — Join waitlist for fully booked dates
- `GET    /api/waitlist` — View active waitlist entries
- `DELETE /api/waitlist/:id` — Leave waitlist

### 🔔 Notifications (`/api/notifications`)
- `GET   /api/notifications` — View user notifications with unread count
- `PATCH /api/notifications/:id/read` — Mark a notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

### 📊 Admin (`/api/admin`)
- `GET    /api/admin/users` — Manage users (search, filter by role, pagination)
- `PATCH  /api/admin/users/:id/deactivate` — Activate or deactivate user accounts
- `POST   /api/admin/doctors` — Admin directly creates verified doctor accounts
- `DELETE /api/admin/doctors/:id` — Safely remove doctor account and associated records
- `GET    /api/admin/analytics` — Platform metrics (volume, status breakdown, specializations, daily trends)

### 🏥 Health Check (`/api/health`)
- `GET /api/health` — Returns status, timestamp, and environment

---

## 🛠️ Build & Production Deployment

To create an optimized production build:

```bash
# Build production bundle
npm run build

# Start production server
npm start
```
