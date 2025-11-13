# EMS Project — Complete Project Outline

Last updated: 2025-09-08

This document is a comprehensive, single-file outline of the EMS (Event Management System) project found in this repository. It captures the architecture, file structure, important source files, API endpoints, database schema, run instructions, environment configuration, assumptions, quality gates, and next steps.

## Checklist (requirements for this task)
- [x] Produce a single Markdown file containing an entire outline of the project
- [x] Include file structure and descriptions for frontend and backend
- [x] List dependencies and scripts from `package.json` files
- [x] Document API endpoints implemented by the backend with request/response shapes
- [x] Include the database schema and explanation for each table
- [x] Provide run/build/test instructions and required environment variables
- [x] Note assumptions, security recommendations and next steps

## High-level architecture

- Frontend: React application bootstrapped with Create React App located in `./` (folder `EMS-main`).
- Backend / API: Express server located in `../service` (folder `service`) that connects to a MySQL database.
- Database: MySQL (schema available at `database/schema.sql`).
- Storage: Uploaded event images are stored on disk under `service/uploads` and served as static files by the backend.

## Where to find things

- Project root (frontend app): `EMS-main/EMS-main`
- Backend service: `EMS-main/service`
- Database assets: `EMS-main/database` (includes `schema.sql`)
- Top-level package: `EMS-main/package.json` (some shared deps)

## Top-level files/directories (important ones)

- `EMS-main/EMS-main/package.json` — frontend app manifests, scripts and dependencies.
- `EMS-main/service/package.json` — backend service manifest and dependencies.
- `EMS-main/service/index.js` — primary Express server; contains routes for auth and event management.
- `EMS-main/database/schema.sql` — SQL schema used to create the MySQL database and all tables.
- `EMS-main/EMS-main/src` — React source code.
- `EMS-main/EMS-main/public` — static assets for the frontend (index.html, icons, manifest).

## Frontend — summary and important files

Root: `EMS-main/EMS-main/src`

- `index.js` — React entry point. Renders `App` and imports bootstrap CSS/JS and `reportWebVitals`.
- `App.js` — Router and routes. Routes defined:
  - `/` -> `Home` (from `components/home/HomePage.js`)
  - `/EventsPage` -> `EventsPage` (list & filters)
  - `/admin` -> `LoginForm` (admin login UI)
  - `/addevent` -> `EventForm` (admin event creation)

### Components (by folder) — file → brief purpose

- `components/Navbar.js` (`src/components/navbar.js`) — top navigation bar using `react-router` links.
- `components/Icons.js` (`src/components/Icons.js`) — small icon components used throughout UI (e.g., `CalendarIcon`, `MailIcon`).

- `components/LoginForm.js` — sign-in / sign-up UI, uses `formik` and `src/services/authService.js` for API calls.

- `components/home/*`
  - `HomePage.js` — page wrapper that imports `BaseHome`, categories, featured and upcoming sections.
  - `Home.js` (BaseHome) — main landing content.
  - `Categories.js`, `CategoryCard.js` — categories UI.
  - `EventCard.js` — presentation card for a featured event.
  - `FeatureEventSection.js` — highlighted events section.
  - `UpcomingEvents.js` — list of upcoming events.
  - `Slider.js` — carousel/slider used on the home page.
  - `Footer.js` — site footer.

- `components/events/user/*`
  - `EventsPage.js` — page managing client-side event filtering and search (uses local `MOCKDATA` by default).
  - `FilterBar.js`, `FilterBar.css` — filters UI for events (search, category, price, date).
  - `EventList.js` — lists event cards.
  - `EventCard.js` — user-facing event card component.
  - `MOCKDATA.js` — local mock dataset used by `EventsPage` for demo purposes.

- `components/events/admin/*`
  - `EventForm.js` — complex two-step form (details + media) for creating or editing an event; handles uploads and POST/PUT to backend `POST /api/events` and `PUT /api/events/:id`.
  - `EventForm.css` — styling for the event form.
  - `EventEditForm.js` — (present in repo; used for editing flows).

- `components/ui/*`
  - `Button.js`, `Input.js`, `PasswordInput.js`, `TabSwitcher.js`, `index.js` — small reusable UI building blocks.

### Hooks and Utilities

- `src/hooks/useFormState.js` — custom hook used by forms (small helper).
- `src/utils/validation.js` — client-side validation helper used by `LoginForm` and forms.

### Services (frontend)

- `src/services/authService.js` — wrapper for auth API calls. Base URL is `process.env.REACT_APP_API_URL || 'http://localhost:3001/api/auth'`. Exposes:
  - `loginUser(email, password)` → POST `/login` with { Email, Password }
  - `registerUser(name, email, password)` → POST `/register` with { Name, Email, Password }
  - `logoutUser()` → GET `/logout`

- `src/services/eventService.js` — axios-based service for event-related endpoints. Methods include:
  - `getEvents()` → GET `/api/events`
  - `getEventById(eventId)` → GET `/api/events/:id`
  - `getEventsByCategory(eventType)` → GET `/api/events?eventType=...`
  - `getEventsByPrice(price)` → GET `/api/events?Price=...`
  - `getEventsByDate(date)` → GET `/api/events?Date=...`
  - `deleteEvent(eventId)` → DELETE `/api/events/:id`
  - `updateEvent(eventId, eventData)` → PUT `/api/events/:id`

Note: Axios requests in `eventService` are hard-coded to `http://localhost:3001/api/events`. The frontend `authService` uses `REACT_APP_API_URL` fallback; consider unifying these via env var.

## Backend (Express service)

Location: `EMS-main/service/index.js` (entry point)

Overview:

- Uses `express`, `mysql2`, `cors`, `bcryptjs`, `multer` for handling API requests, DB access, password hashing and file uploads.
- Serves uploaded images statically at `/uploads`.
- MySQL connection is created in the file with hard-coded values:
  - host: `localhost`
  - user: `root`
  - password: `abhik` (hard-coded in `index.js`) — move to environment variables for real deployments
  - database: `ems_db`

### Implemented API endpoints (summary)

- Auth endpoints (under `/api/auth` namespace):
  - POST `/api/auth/register`
    - Request body: { FullName, Email, Password, Role? }
    - Behavior: Validates fields, hashes Password using bcryptjs, inserts into `admin` table as an organizer or admin.
    - Response: inserted AdminID, FullName, Email and success message on success.

  - POST `/api/auth/login`
    - Request body: { Email, Password }
    - Behavior: Looks up `admin` by Email, compares password with stored `PasswordHash`. On success returns Admin info (AdminID, FullName, Email, Role).
    - Error codes: 400 for missing fields, 401 for invalid credentials, 500 for server/DB errors.

  - GET `/api/auth/logout` — simple endpoint that returns a logout success message (no session handling implemented).

- Admin update endpoint:
  - PUT `/admin/:adminId`
    - Request body: { Password?, Role? }
    - Behavior: updates `PasswordHash` if password provided (bcrypt hash), updates Role if provided.

- Event endpoints (`/api/events`):
  - POST `/api/events` (multipart/form-data)
    - Expects fields: Name, Description, StartDate, EndDate, Location, Category, EventType, EventStatus, OrganizerID, EventMode, RequiresSeat, TicketPrice
    - Expects files: `banner` (single), `photos` (multiple, up to 3 in server config)
    - Behavior: Inserts new row in `event` table and writes any uploaded image paths to `event_images`.
    - Response: { message: 'Event created successfully', eventID }

  - GET `/api/events/:id`
    - Response: event row plus `images` array from `event_images`.

  - PUT `/api/events/:id` (multipart/form-data)
    - Behavior: Partial update fields are supported; also accepts new images and stores them in `event_images`.

  - GET `/api/events`
    - Behavior: returns `SELECT * FROM event ORDER BY StartDate ASC`.

  - DELETE `/api/events/:id` is referenced in the frontend service but not implemented in `service/index.js` (note: `eventService.deleteEvent` exists on frontend as axios.delete; backend doesn't implement DELETE — consider adding).

### File uploads

- `multer` configured to store files under `service/uploads/events` and filename uses `Date.now()` + original extension.
- Uploaded images are saved to disk and their paths are saved in `event_images.ImagePath`.

## Database schema (from `database/schema.sql`)

The database used is `ems_db`. Important tables:

- `user` — stores attendees/customers
  - `UserID` (PK), `FullName`, `Email` (unique), `PasswordHash`, `Phone`, `CreatedAt`

- `admin` — organizers and admin users
  - `AdminID` (PK), `FullName`, `Email` (unique), `PasswordHash`, `Role` ENUM('ADMIN','ORGANIZER'), `CreatedAt`

- `event` — core event table
  - `EventID` (PK), `Name`, `Description`, `StartDate`, `EndDate`, `Location`, `Category`, `eventType`, `eventStatus` ENUM('ACTIVE','CANCELLED'), `OrganizerID` (FK->admin.AdminID), `eventMode` ENUM('ONLINE','OFFLINE'), `requiresSeat` TINYINT, `ticketPrice` DECIMAL

- `seat_category` — categories of seats (VIP, Regular)
  - `SeatCategoryID` (PK), `EventID` (FK->event), `CategoryName`, `Price`, `TotalSeats`

- `seat` — individual seat table (optional)
  - `SeatID` (PK), `SeatCategoryID` (FK -> seat_category), `SeatNumber`

- `ticket` — bookings
  - `TicketID` (PK), `EventID` (FK->event), `UserID` (FK->user), `BookingDate`, `Quantity`, `Status` ENUM('CONFIRMED','CANCELLED'), `finalPrice`

- `ticket_seat` — ticket-seat junction table (if exact seat mapping required)

- `feedback` — event feedback from users
  - `FeedbackID`, `EventID`, `UserID`, `Rating` (1–5), `Comment`, `CreatedAt`

- `event_images` — stores uploaded image metadata
  - `ImageID`, `EventID`, `ImagePath`, `ImageType` ENUM('BANNER','PHOTO'), `UploadedAt`

Full SQL schema file: `database/schema.sql` (recommended to use to create DB and tables during local setup).

## Frontend & Backend dependencies and scripts

1) Frontend `EMS-main/EMS-main/package.json` highlights

- Scripts:
  - `start` — `react-scripts start`
  - `build` — `react-scripts build`
  - `test` — `react-scripts test`
  - `eject` — `react-scripts eject`
  - `format` / `format:check` — prettier commands

- Notable dependencies:
  - `react` ^19, `react-dom`, `react-router-dom`, `axios`, `bootstrap`, `react-bootstrap`, `formik`, `web-vitals`, `prettier` (dev)

2) Backend `EMS-main/service/package.json` highlights

- Scripts: currently only `test` placeholder. You will typically start the server with `node index.js`.
- Dependencies: `express`, `mysql2`, `cors`, `bcryptjs` (and `bcrypt` is installed), `multer`.

3) Top-level `EMS-main/package.json`

- Contains a small dependency list (bcryptjs, cors, create-react-app, express, mysql2) — appears duplicated across folder levels. Use the specific `EMS-main/EMS-main` and `service` package.json files when running frontend vs backend.

## Environment variables & configuration

- Frontend:
  - `REACT_APP_API_URL` — if set, `src/services/authService.js` will use it for auth endpoints; otherwise auth defaults to `http://localhost:3001/api/auth`.

- Backend (recommended, not currently used):
  - Database credentials (host, user, password, database) should be moved out of `service/index.js` to environment variables such as `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
  - Port can be made configurable (`PORT`) rather than hard-coded `3001`.

## How to run (local development)

Prerequisites:
- Node.js (v16+ recommended)
- npm or yarn
- MySQL server running locally

Steps (PowerShell examples):

1) Start the backend service

```powershell
cd .\service
npm install
# create database and tables (run the SQL in your MySQL client):
# Use the SQL file database/schema.sql to create `ems_db` and tables
node index.js
```

2) Start the frontend app

```powershell
cd ..\EMS-main
npm install
npm start
```

Open the frontend at http://localhost:3000 and the backend is expected at http://localhost:3001

Notes:
- The backend uses hard-coded DB credentials in `service/index.js` (user `root`, password `abhik`). Update `index.js` to read from environment variables and do not commit secrets.
- The backend listens on port `3001` by default.

## Known gaps, TODOs and recommendations

- Security / secrets: Move database credentials and any sensitive configuration into environment variables or a secrets manager. Do not keep them in source.
- Authentication: The backend returns admin info on login but there is no session or token (JWT) handling implemented. Add JWT or session middleware for real auth flows.
- Missing endpoints: `DELETE /api/events/:id` is used by frontend code but not implemented in `service/index.js`.
- Input validation: Backend lacks robust validation and rate-limiting. Add `express-validator` or equivalent and input sanitization.
- Tests: Add unit/integration tests for API and frontend components. Currently only CRA test hooks are present.
- CORS, file storage and static hosting: For production, consider storing images in S3 or similar and serve via CDN.

## Quality gates / quick triage

- Build: Frontend `npm start` (development) and `npm run build` (production build) — expected to work if `node_modules` are installed and no local compile issues. (Not executed in this document)
- Lint/Format: Prettier configured via `format` scripts in frontend.
- Tests: `npm test` uses CRA test runner (frontend). Backend has no test script yet.

Requirements coverage (mapping to the user's request):

- Create single .md with entire project outline: Done — this file.
- Include file structure and component details: Done — section "Frontend — summary and important files".
- Include API endpoints and DB schema: Done — "Backend (Express service)" and "Database schema" sections.
- Provide run instructions and env notes: Done — "How to run" and "Environment variables & configuration".

## Quick next steps (recommended)

1. Replace hard-coded DB credentials in `service/index.js` with environment variables.
2. Implement authentication by generating and verifying JWTs and protect admin routes.
3. Add `DELETE /api/events/:id` endpoint or change frontend service to not call delete until implemented.
4. Add basic unit tests for `service` endpoints (supertest + jest) and for critical React components.
5. Add a small `.env.example` file listing required env variables (REACT_APP_API_URL, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT).

## Contacts / Where to look for more information

- Frontend source: `EMS-main/EMS-main/src`
- Backend code: `EMS-main/service/index.js`
- Database schema: `EMS-main/database/schema.sql`

---

If you want, I can also:
- generate a `.env.example` and update `service/index.js` to read env vars, or
- implement `DELETE /api/events/:id` on the backend and wire it to the frontend service, or
- add a small integration test that spins up the Express app and runs a few API calls.
