# Melu-e Frontend

A modern, accessible React Native & Expo Web application designed for special education professionals, teachers, coordinators, administrators, and parents. Melu-e simplifies individualized education plan (IEP) tracking, active ABA/discrete trial data collection, ABC behavioral incident logging, student enrollment, schedule capacity management, and dynamic form configuration.

---

## Technical Stack

- **Framework**: [Expo SDK 54](https://expo.dev) with [Expo Router 6](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Core UI**: React 19, React Native 0.81, React Native Web 0.21
- **Icons & Styling**: [Lucide React Native](https://lucide.dev/icons/), React Native Safe Area Context, React Native SVG
- **Network & State**: [Axios](https://axios-http.com) HTTP client with Bearer JWT interceptors, TanStack React Query patterns
- **Forms & Validation**: React Hook Form, Zod schema validation
- **Type Safety**: TypeScript 5.9 with strict type checking
- **Testing**: Vitest 4

---

## System Requirements & Prerequisites

Ensure the following tools are installed on your workstation:

- **Node.js**: `v18.x` or `v20.x+` (LTS recommended)
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari
- **(Optional) Mobile Testing**: Expo Go app on iOS/Android or Xcode / Android Studio simulators

---

## Quick Start & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/fyorina21/Melu-e-frontend-.git
cd Melu-e-frontend-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment configuration file to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the API endpoint:

```env
# Rails 8 backend API address
EXPO_PUBLIC_API_URL=http://localhost:3000

# Set to false to send live HTTP requests to Rails/PostgreSQL
# Set to true to run in offline mock mode
EXPO_PUBLIC_DEMO_MODE=false
```

> [!IMPORTANT]
> Never commit `.env` or `.env.local` to git. The `.gitignore` file is pre-configured to strictly exclude all environment files except `.env.example`.

---

## Running the Application

### Option A: Dual-Stack Launcher (Recommended)

To start both the Rails backend and Expo Web bundle concurrently with a single command from this repository:

```bash
npm run dev:all
```

This starts:
- Rails API backend on `http://localhost:3000`
- Expo Web client on `http://localhost:8081`

### Option B: Frontend Only

If your Rails backend is already running separately:

```bash
npm run web
```

Then open `http://localhost:8081` in your browser.

### Option C: Mobile Development

```bash
# Start Expo interactive CLI
npm run start

# Launch directly on Android emulator
npm run android

# Launch directly on iOS simulator (macOS only)
npm run ios
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run web` | Starts Expo Web bundler on port 8081 |
| `npm run dev:all` | Concurrently boots Rails 3000 + Expo Web 8081 |
| `npm run start` | Starts Expo development server with QR code |
| `npm run typecheck` | Runs TypeScript compiler checks without emitting code |
| `npm run test` | Runs the Vitest test suite |

---

## Architecture & Directory Structure

```text
Melu-e-frontend-/
├── app/                        # Expo Router file-based screens and routes
│   ├── (auth)/                 # Authentication screens (Login, Reset Password)
│   ├── (tabs)/                 # Main application tab layout and views
│   ├── admin/                  # Admin portal (Forms builder, ABC lists, Scheduling)
│   ├── coordinator/            # Coordinator portal (Student enrollment, Roster)
│   ├── teacher/                # Teacher portal (Trial logging, ABC logs, Assessments)
│   ├── parent/                 # Parent portal (Progress reports, Communications)
│   └── _layout.tsx             # Root layout with AuthProvider & QueryClientProvider
├── assets/                     # Static images, icons, and fonts
├── scripts/                    # Development automation scripts (dev-all.js)
├── src/
│   ├── api/
│   │   ├── config/             # Environment URL & demo mode resolver
│   │   ├── http/               # Axios client, interceptors, error mapping
│   │   ├── mock/               # Offline fallback data and mock handlers
│   │   └── resources/          # API resource modules (auth, sessions, students, etc.)
│   ├── components/             # Reusable UI components (Buttons, Modals, Forms)
│   ├── context/                # React context providers (AuthContext, ThemeContext)
│   ├── hooks/                  # Custom React hooks
│   ├── theme/                  # Design system tokens (colors, typography, spacing)
│   └── types/                  # Shared TypeScript interfaces and domain models
├── .env.example                # Sanitized template for environment variables
├── .gitignore                  # Git ignore rules for node_modules, .expo, .env
├── app.json                    # Expo project configuration
├── package.json                # Project dependencies and npm scripts
└── tsconfig.json               # TypeScript compiler options
```

---

## Default Demo Accounts

When connecting to the local Rails backend seeded with `bin/rails db:seed` or `bin/rails runner script/seed_demo_accounts.rb`, use the following pre-configured accounts:

| Role | Email | Password | Landing Portal |
|---|---|---|---|
| **Teacher** | `teacher@melue.org` | `demo1234` | `/teacher/dashboard` |
| **Coordinator** | `coordinator@melue.org` | `demo1234` | `/coordinator/dashboard` |
| **Admin** | `admin@melue.org` | `demo1234` | `/admin/dashboard` |
| **Sysadmin** | `sysadmin@melue.org` | `demo1234` | `/admin/dashboard` |
| **Program Director**| `pd@melue.org` | `demo1234` | `/pd/dashboard` |
| **Parent** | `parent@melue.org` | `demo1234` | `/parent/dashboard` |

---

## Code Quality & Verification

Before submitting pull requests, run:

```bash
# 1. Verify TypeScript types
npm run typecheck

# 2. Run unit and integration tests
npm run test
```

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.