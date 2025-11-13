# EMS — API, Database Constraints, Validation & Client-side Validation

This document supplements the existing `PROJECT_OUTLINE.md` with concrete Database Constraints, API Payload examples, API validation rules, business validation details, and client-side validation guidance.

Location references
- SQL schema: `database/schema.sql` (canonical table definitions)
- Backend API implementation: `service/index.js`
- Frontend validation helpers: `src/utils/validation.js`
- Frontend upload form: `src/components/events/admin/EventForm.js`

---

## 1) Database Constraints (summary from `database/schema.sql`)

General notes:
- Database: MySQL
- All foreign keys use standard referential integrity. Many FK columns reference `user(UserID)` or `event(EventID)`.

Tables and important constraints

1. `user`
- Columns:
  - `UserID` INT AUTO_INCREMENT PRIMARY KEY
  - `FullName` VARCHAR(150) NOT NULL
  - `Email` VARCHAR(150) UNIQUE NOT NULL
  - `PasswordHash` VARCHAR(255) NOT NULL
  - `Phone` VARCHAR(20)
  - `Role` ENUM('CUSTOMER','EVENT_MANAGER','ADMIN') NOT NULL DEFAULT 'CUSTOMER'
  - `Status` ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
  - `CreatedAt`, `UpdatedAt` timestamps
- Important constraints: `Email` must be unique and NOT NULL; `Role` is constrained by ENUM.

2. `customer`
- `UserID` INT NOT NULL; FK -> `user(UserID)` ON DELETE CASCADE
- No separate PK in the schema (the table relies on `UserID` uniqueness implicitly) — consider making `UserID` primary key if needed.
- Various nullable profile fields (Address, DOB, etc.)

3. `event_organizer`
- `UserID` INT NOT NULL; FK -> `user(UserID)` ON DELETE CASCADE
- Stores organizer-specific metadata

4. `event`
- `EventID` INT AUTO_INCREMENT PRIMARY KEY
- `Name` VARCHAR(255) NOT NULL
- `StartDate`, `EndDate` DATETIME (nullable)
- `OrganizerID` INT NOT NULL; FK -> `user(UserID)` (organizer)
- `eventMode` ENUM('ONLINE','OFFLINE') NOT NULL
- `requiresSeat` TINYINT(1) NOT NULL DEFAULT 0
- `ticketPrice` DECIMAL(10,2) NULL
- `eventStatus` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING'
- `ApprovedBy` FK -> `user(UserID)` (nullable)
- Important constraints: `Name` NOT NULL; `OrganizerID` must reference an existing user; `eventMode` cannot be null.

5. `seat_category`
- `SeatCategoryID` PK
- `EventID` FK -> `event(EventID)`
- `CategoryName` NOT NULL, `Price` DECIMAL(10,2) NOT NULL, `TotalSeats` INT NOT NULL

6. `seat`
- `SeatID` PK, `SeatCategoryID` FK -> `seat_category(SeatCategoryID)`

7. `ticket`
- `TicketID` PK
- `EventID` FK -> `event(EventID)`
- `UserID` FK -> `user(UserID)`
- `BookingDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `Quantity` INT NOT NULL
- `finalPrice` DECIMAL(10,2) NOT NULL

8. `ticket_seat`
- Junction table between `ticket` and `seat`

9. `feedback`
- `FeedbackID` PK
- `EventID` FK -> `event(EventID)`
- `UserID` FK -> `user(UserID)`
- `Rating` INT with `CHECK (Rating BETWEEN 1 AND 5)`

10. `event_images`
- Holds images per event. In the provided schema the `ImageID` row references `EventID` (ensure the actual CREATE includes columns `EventID`, `ImagePath`, `ImageType` in your copy).

Indexes
- `idx_user_email` on `user(Email)`
- `idx_event_status` on `event(eventStatus)`
- `idx_ticket_event` on `ticket(EventID)`
- `idx_ticket_user` on `ticket(UserID)`

Recommended schema improvements (if you control DB):
- Make `customer.UserID` and `event_organizer.UserID` the PRIMARY KEY to enforce one-to-one relationship with `user`.
- Ensure `event_images` table includes `EventID INT NOT NULL, ImagePath VARCHAR(255), ImageType ENUM('BANNER','PHOTO')` and FK to `event(EventID)` with ON DELETE CASCADE.
- Add NOT NULL where appropriate (e.g., `ticket.finalPrice` already NOT NULL but ensure `ticket.Quantity` not null and > 0 via CHECK if MySQL version supports it).

---

## 2) API Endpoints & Payload Examples

Source: `service/index.js`. Listed endpoints below with request/response examples and status codes.

A. POST /api/auth/register
- Content-Type: application/json
- Request body:
```json
{
  "FullName": "John Doe",
  "Email": "john@example.com",
  "Password": "password123",
  "Role": "CUSTOMER"   // or EVENT_MANAGER, ADMIN
}
```
- Successful response (201/200):
```json
{
  "UserID": 12,
  "FullName": "John Doe",
  "Email": "john@example.com",
  "Role": "CUSTOMER",
  "message": "Customer registered successfully"
}
```
- Error responses:
  - 400: missing fields or invalid role
  - 409: ER_DUP_ENTRY (email already registered)
  - 500: DB error

B. POST /api/auth/login
- Content-Type: application/json
- Request body:
```json
{
  "Email": "john@example.com",
  "Password": "password123",
  "Role": "CUSTOMER"
}
```
- Successful response (200):
```json
{
  "UserID": 12,
  "FullName": "John Doe",
  "Email": "john@example.com",
  "Role": "CUSTOMER",
  "profile": { /* customer profile row or null */ },
  "message": "Login successful"
}
```
- Error responses:
  - 400: missing fields
  - 401: invalid credentials
  - 403: role mismatch (account not registered as requested role)
  - 500: DB error

C. GET /api/auth/logout
- No body. Response: { message: 'Logged out successfully' }

D. PUT /admin/:adminId
- Content-Type: application/json
- Request body (one or both fields):
```json
{ "Password": "new-password", "Role": "ADMIN" }
```
- Response: 200 on success, 404 if not found

E. POST /api/events (multipart/form-data)
- Used to create events and upload images. Fields (example):
  - `Name` (string, required)
  - `Description` (string)
  - `StartDate` (ISO string / datetime)
  - `EndDate` (ISO string / datetime)
  - `Location` (string)
  - `Category` (string)
  - `EventType` (string)
  - `EventStatus` (optional)
  - `OrganizerID` (int, required)
  - `EventMode` (ONLINE|OFFLINE required)
  - `RequiresSeat` (0/1)
  - `TicketPrice` (decimal)
  - Files: `banner` (single file), `photos` (up to 3)
- Example using multipart: one `banner` file + `photos[]` files
- Success: 200 JSON { message: 'Event created successfully', eventID }
- Errors: 400 if required fields missing, 500 on DB error

F. GET /api/events/:id
- Returns event row plus `images` array (image path, type). Example response:
```json
{
  "EventID": 5,
  "Name": "Tech Summit",
  "Description": "...",
  "StartDate": "2025-09-20T10:00:00.000Z",
  "EndDate": "2025-09-20T17:00:00.000Z",
  "Location": "...",
  "Category": "Tech",
  "eventType": "Conference",
  "eventStatus": "ACTIVE",
  "OrganizerID": 3,
  "eventMode": "OFFLINE",
  "requiresSeat": 1,
  "ticketPrice": 99.00,
  "images": [
    { "ImagePath": "service/uploads/events/163...jpg", "ImageType": "BANNER" },
    { "ImagePath": "...", "ImageType": "PHOTO" }
  ]
}
```

G. PUT /api/events/:id (multipart/form-data)
- Same fields as POST; used to update event and optionally upload new images.
- Success response JSON: { message: 'Event updated successfully' }

H. GET /api/events
- Returns list of events (array of event rows). Support for query params exists in frontend but backend currently returns all events ordered by StartDate.

Other endpoints (not implemented out-of-the-box in `index.js` but present in schema): ticket creation, feedback, seat allocation. Those would be specified similarly when implemented.

---

## 3) API-side Validation (what server currently enforces and recommended additions)

Current server-side validation (from `service/index.js`):
- Auth register/login: checks presence of required fields (FullName, Email, Password, Role) and validates Role against `['CUSTOMER','EVENT_MANAGER','ADMIN']`.
- Register: hashes password and attempts insert; handles duplicate email (ER_DUP_ENTRY) with 409.
- Login: fetches user by email, verifies password using bcrypt, checks that the requested Role matches account.Role and returns 401/403 as appropriate.
- Events POST/PUT: checks `Name`, `OrganizerID`, `EventMode` presence; inserts event row and images.

Recommended server-side validation improvements (explicit & enforced):
- Data types & length checks
  - `Email` length and pattern (server-side email regex)
  - `FullName` max length 150
  - `ticketPrice` must be >= 0 and numeric; `TotalSeats` positive integer
  - `StartDate` / `EndDate` must be valid ISO datetimes; enforce StartDate < EndDate if both present
- Business rules
  - If `requiresSeat` is true, then `seat_category` entries or `ticketPrice` must be provided and positive
  - Organizer consistency: `OrganizerID` must refer to a user with Role `EVENT_MANAGER` (or ADMIN allowed) — check before insert
  - File validation: allow only images (jpeg/png/webp), max file sizes (e.g., 3–5MB per file)
- Rate limiting and brute-force protection on `/api/auth/login`
- Proper input sanitization / prepared statements (the code uses parameterized queries, good)
- Return consistent error structure: { error: 'message', code: 'SOME_CODE' }

Validation examples (pseudocode):
- On event create: if (!Name) -> 400
- if (!OrganizerID) -> 400
- lookup user role for OrganizerID; if not event manager and not admin -> 403
- if (requiresSeat && (!seatCategories || seatCategories.length === 0)) -> 400

---

## 4) Business Validation Details (rules enforced by API or application logic)

- Account Roles
  - Only users with Role `ADMIN` may access admin UI/routes. Frontend checks `localStorage.role` and the backend should verify privileges on admin APIs.
  - Event creation/updating should require Organizer to be `EVENT_MANAGER` (or ADMIN acting for an organizer).

- Event lifecycle
  - Newly created events default to `PENDING` status; an approver (ADMIN) can set `eventStatus` to `APPROVED` and set `ApprovedBy`/`ApprovedAt`.
  - Published events (status APPROVED or ACTIVE) are visible to users; PENDING/DRAFT remain hidden.

- Seating / Pricing logic
  - If `requiresSeat = 1` then event must define `seat_category` rows with `TotalSeats` and `Price`.
  - If `requiresSeat = 0` and `ticketPrice` provided, that price is used per ticket.
  - `ticket.finalPrice` stored on booking to avoid future price drift.

- Unique constraints
  - Email uniqueness prevents multiple accounts with same email.
  - Seat numbers within a seat category should be unique (enforce with unique index on (SeatCategoryID, SeatNumber) if using seat table).

---

## 5) Client-side Validation (what frontend already does and recommended additions)

Existing client-side validation
- `src/utils/validation.js` implements:
  - `validateEmail` (presence + regex)
  - `validatePassword` (presence + min length 6)
  - `validateName` (presence + min length 2)
  - `validateConfirmPassword` (matches password)
  - `validateForm(values, activeTab)` — used by `LoginForm` via Formik to validate sign-in and sign-up flows.
- `EventForm.js` includes UI checks before submission (in the file it currently `alert()`s that banner is required and at least 3 additional photos are required) — these were updated to use modals in the UI.

Recommended client-side validation to implement across forms
- Auth (Login / Register)
  - Email pattern and required
  - Password min length (6) and optionally complexity
  - Name required for signup (min 2 characters)
  - Confirm password equals password

- Event form (EventForm)
  - Required: `Name`, `OrganizerID` (should be the logged-in organizer ID), `EventMode` (ONLINE|OFFLINE)
  - Date/time validation: if provided, `StartDate` and `EndDate` must be valid and StartDate < EndDate
  - Price validation: numeric, >= 0
  - Seat categories: if `requiresSeat` selected, ensure at least one seat category with positive `TotalSeats` and `Price` exists
  - File validation: check file MIME types (image/jpeg, image/png, image/webp) and file size (e.g., <= 5MB) before adding to FormData
  - Photo count: show warning if fewer than recommended photos; block submission if banner not selected

- UX validation behaviors
  - Show inline validation messages next to inputs (don't use alert())
  - Disable submit button while submitting
  - Scroll to first validation error on submit

Client-side code examples
- Already present: `validateForm` in `src/utils/validation.js` used with Formik in `LoginForm`.
- Add checks in `EventForm.handleSubmit` before creating `FormData`. Example (pseudocode):
```js
if (!formData.Name) { setError('Name is required'); return; }
if (formData.requiresSeat && (!seatCategories || seatCategories.length === 0)) { setError('Add seat categories'); return; }
if (bannerFile && !allowedTypes.includes(bannerFile.type)) { setError('Unsupported banner file type'); return; }
```

---

## 6) Example error and success response formats

Standardize responses across API for easier client handling:
- Success:
```json
{ "success": true, "data": { ... }, "message": "Optional human readable" }
```
- Error:
```json
{ "success": false, "error": "Validation failed", "details": { "email": "Email is required" }, "code": "VALIDATION_ERROR" }
```

The current backend uses a mixture of patterns (sometimes `{ error: '...' }`, sometimes the raw row). Consider normalizing as above.

---

## 7) Implementation checklist for the team (recommended next steps)

- Normalize API responses (wrap with { success, data, error, code }).
- Add server-side validations described above and return structured validation errors (field-level details).
- Enforce organizer role check in event creation and admin-only checks in admin routes.
- Add file size/type checks for uploads and storage quotas.
- Add unit/integration tests for auth and event creation flows.
- Add rate limiting and basic brute-force protection for auth endpoints.

---

## 8) Where to edit / add validations in codebase
- Server: `service/index.js` (auth and events) — add explicit validation before DB queries.
- Database: `database/schema.sql` for schema adjustments (primary key changes, indexes).
- Frontend validation helpers: `src/utils/validation.js` and per-form logic in `src/components/events/admin/EventForm.js` and `src/components/LoginForm.js`.

---

If you want, I can:
- Generate a machine-readable OpenAPI (Swagger) spec for all implemented endpoints using the request/response examples above.
- Implement server-side role checks for `POST /api/events` and `PUT /admin/:adminId` in the Express service.
- Add more detailed JSON Schema for each endpoint's payload for validation libraries (e.g., Ajv).

Tell me which of those you want next and I will add it to the repo.
