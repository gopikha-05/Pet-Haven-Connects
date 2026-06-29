# PetHaven Connect

**Pet Adoption & Care Management System** — Production-grade frontend for a college full-stack project.

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 4
- React Router DOM 7
- Axios (API client with JWT interceptors)
- Framer Motion
- React Icons
- Recharts
- Context API (auth + toast)

## Features

- **Authentication**: Login, register, forgot password, role-based signup (Adopter, Shelter Staff, Veterinarian, Admin), JWT mock flow, protected routes, remember me, sessions UI
- **Adopter portal**: Browse pets, filters, adoption applications, care schedule, vet booking, health records, donations, supplies, badges
- **Shelter portal**: Dashboard analytics, pet CRUD, application approval, compliance, complaints
- **Vet portal**: Calendar, appointments, medical records, vaccinations, feedback
- **Admin portal**: Platform KPIs, user/shelter/vet monitoring, complaints, analytics, reports, rules
- **Public pages**: Home, About, Contact, FAQ, Stories, Pet details, Donate (mock UPI/card/wallet), 404
- **Shared**: Profile, Settings, Notifications

## Quick Start (VS Code)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- VS Code

### Steps

1. **Open the project**
   ```bash
   cd "Pet Haven Connect"
   code .
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. Open the URL shown in the terminal (usually `http://localhost:5173`).

5. **Production build**
   ```bash
   npm run build
   npm run preview
   ```

## Demo Accounts

| Role    | Email                 | Password      |
|---------|-----------------------|---------------|
| Adopter | adopter@pethaven.com  | Adopter@123   |
| Shelter | shelter@pethaven.com  | Shelter@123   |
| Vet     | vet@pethaven.com      | Vet@123456    |
| Admin   | admin@pethaven.com    | Admin@123456  |

On the login page, click a role chip to auto-fill credentials.

### License formats (registration)

- Shelter: `SHL-2024-10452`
- Veterinarian: `VET-2024-88231`

## Project Structure

```
src/
├── assets/
├── components/
│   ├── cards/          # PetCard, etc.
│   ├── charts/         # Recharts wrappers
│   ├── common/         # Button, Badge, KPI, Pagination, etc.
│   ├── forms/          # Input, Select, PasswordInput
│   ├── layout/         # Navbar, Footer, Sidebar
│   └── modals/         # Modal, FilterDrawer
├── config/             # Navigation menus
├── constants/          # Roles, routes, statuses
├── context/            # Auth, Toast
├── hooks/              # useFetch, usePagination, useDebounce
├── layouts/            # Public, Auth, Dashboard, role layouts
├── mock/               # JSON mock data
├── pages/
│   ├── auth/
│   ├── public/
│   ├── shared/
│   ├── adopter/
│   ├── shelter/
│   ├── veterinarian/
│   └── admin/
├── routes/             # ProtectedRoute
├── services/           # Mock API + Axios client
└── utils/              # JWT, validation, formatters
```

## Backend Integration

This is **frontend-only**. Mock APIs live in `src/services/` and `src/mock/`.

To connect a real backend:

1. Set `VITE_API_URL` in `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
2. Replace mock service calls with `api` from `src/services/api.js`.
3. Ensure your API returns `{ accessToken, refreshToken, user }` on login.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint               |

## License

College project — educational use.
