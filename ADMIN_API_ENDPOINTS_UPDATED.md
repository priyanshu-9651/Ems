# Admin API Endpoints - Updated Implementation

## Overview
This document describes the complete implementation of all admin API endpoints based on `AdminSetup.md`, with proper integration into the React frontend.

---

## API Base URL

**Backend Base:** `http://localhost:8080`  
**Admin Endpoints Prefix:** `/admin/Admin`

**Full Base URL for all admin endpoints:** `http://localhost:8080/admin/Admin`

---

## Implementation Summary

### ✅ Files Updated

1. **`src/services/authService.js`**
   - Added all 10 admin API functions from AdminSetup.md
   - Uses correct endpoint paths: `/admin/Admin/*`
   - Includes proper error handling and token validation
   - Returns consistent response format

2. **`src/components/AdminDashboard/AdminUserManagement.js`**
   - Updated to use new API functions from authService
   - Implements organizer status management (Enable/Disable)
   - Real-time UI updates after status changes
   - Comprehensive filtering and search

---

## Admin API Functions Implemented

### 1. Add a New Admin
**Function:** `createAdminProfile(profileData)`  
**Endpoint:** `POST /admin/Admin`  
**Description:** Creates a new user with the "Admin" role.

**Request Body:**
```json
{
  "fullName": "New Admin User",
  "email": "admin@example.com",
  "password": "a-strong-password",
  "phone": "555-0000",
  "role": "Admin"
}
```

**Response (201 Created):**
```json
{
  "userId": 102,
  "fullName": "New Admin User",
  "email": "admin@example.com",
  "phone": "555-0000",
  "role": "Admin",
  "status": "ACTIVE",
  "createdAt": "2025-11-11T09:00:00"
}
```

**Usage:**
```javascript
import { createAdminProfile } from '../services/authService';

const response = await createAdminProfile({
  fullName: "John Admin",
  email: "john@admin.com",
  password: "securepass123",
  phone: "555-1234",
  role: "Admin"
});

if (response.success) {
  console.log("Admin created:", response.data);
}
```

---

### 2. Get All Event Organizers
**Function:** `getAllOrganizers()`  
**Endpoint:** `GET /admin/Admin/organizer`  
**Description:** Retrieves a list of all users with the "ORGANIZER" role.

**Response (200 OK):**
```json
[
  {
    "userId": 101,
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "555-1234",
    "role": "ORGANIZER",
    "status": "ACTIVE",
    "createdAt": "2025-11-10T10:30:00"
  }
]
```

**Usage:**
```javascript
import { getAllOrganizers } from '../services/authService';

const response = await getAllOrganizers();
if (response.success) {
  const organizers = response.data;
  setOrganizers(organizers);
}
```

**Used In:** `AdminUserManagement.js` - Displays all organizers in a table

---

### 3. Approve an Event
**Function:** `approveEvent(eventId)`  
**Endpoint:** `PUT /admin/Admin/events/{id}/approve`  
**Description:** Approves a pending event, changing its status to "APPROVED".

**Path Variable:** `{id}` - The event ID to approve

**Response (200 OK):**
```json
{
  "eventId": 202,
  "eventName": "Pending Tech Meetup",
  "eventStatus": "APPROVED",
  "eventApprovedAt": "2025-11-11T14:20:00"
}
```

**Usage:**
```javascript
import { approveEvent } from '../services/authService';

const response = await approveEvent(202);
if (response.success) {
  alert("Event approved successfully!");
}
```

---

### 4. Reject an Event
**Function:** `rejectEvent(eventId, reason)`  
**Endpoint:** `PUT /admin/Admin/events/{id}/reject`  
**Description:** Rejects a pending event with optional reason.

**Parameters:**
- `eventId` (number) - The event ID to reject
- `reason` (string, optional) - Reason for rejection

**Request Body (optional):**
```
"Venue details incomplete"
```

**Response (200 OK):**
```json
{
  "eventId": 202,
  "eventName": "Pending Tech Meetup",
  "eventStatus": "REJECTED: Venue details incomplete"
}
```

**Usage:**
```javascript
import { rejectEvent } from '../services/authService';

const response = await rejectEvent(202, "Venue details incomplete");
if (response.success) {
  alert("Event rejected!");
}
```

---

### 5. Update User Status (Enable/Disable) ⭐
**Function:** `updateUserStatus(userId, status)`  
**Endpoint:** `PATCH /admin/Admin/{id}/status`  
**Description:** Updates the status of any user (ACTIVE or DISABLED).

**Parameters:**
- `userId` (number) - The user ID to update
- `status` (string) - "ACTIVE" or "DISABLED"

**Request Body:**
```json
{
  "status": "DISABLED"
}
```

**Response (200 OK):**
```json
{
  "userId": 101,
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "status": "DISABLED"
}
```

**Usage:**
```javascript
import { updateUserStatus } from '../services/authService';

const response = await updateUserStatus(101, "DISABLED");
if (response.success) {
  console.log("User status updated:", response.data.status);
}
```

**Used In:** `AdminUserManagement.js` - Enable/Disable organizer buttons

---

### 6. Get All Events
**Function:** `getAllEventsAdmin()`  
**Endpoint:** `GET /admin/Admin/events`  
**Description:** Retrieves a list of all events, regardless of status.

**Response (200 OK):**
```json
[
  {
    "eventId": 201,
    "eventName": "Spring Developer Conference",
    "eventStatus": "APPROVED",
    "eventStartDate": "2026-05-10",
    "eventLocation": "Convention Center"
  },
  {
    "eventId": 202,
    "eventName": "Pending Tech Meetup",
    "eventStatus": "PENDING"
  }
]
```

**Usage:**
```javascript
import { getAllEventsAdmin } from '../services/authService';

const response = await getAllEventsAdmin();
if (response.success) {
  const events = response.data;
  setEvents(events);
}
```

---

### 7. Find Users by Name
**Function:** `findUsersByName(fullName)`  
**Endpoint:** `GET /admin/Admin/username/{fullName}`  
**Description:** Searches for users whose full name contains the provided string.

**Path Variable:** `{fullName}` - Search term (e.g., "Jane")

**Response (200 OK):**
```json
[
  {
    "userId": 101,
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "ORGANIZER",
    "status": "ACTIVE"
  }
]
```

**Usage:**
```javascript
import { findUsersByName } from '../services/authService';

const response = await findUsersByName("Jane");
if (response.success) {
  const users = response.data;
  console.log("Found users:", users);
}
```

---

### 8. Get All Event Revenue
**Function:** `getAllEventRevenue()`  
**Endpoint:** `GET /admin/Admin/allrevenue`  
**Description:** Retrieves a revenue report for all events.

**Response (200 OK):**
```json
[
  {
    "eventId": 201,
    "eventName": "Spring Developer Conference",
    "eventTicketPrice": 150,
    "totalRevenue": 45000
  },
  {
    "eventId": 202,
    "eventName": "Pending Tech Meetup",
    "eventTicketPrice": 25,
    "totalRevenue": 500
  }
]
```

**Usage:**
```javascript
import { getAllEventRevenue } from '../services/authService';

const response = await getAllEventRevenue();
if (response.success) {
  const revenue = response.data;
  const totalRevenue = revenue.reduce((sum, r) => sum + r.totalRevenue, 0);
  console.log("Total platform revenue:", totalRevenue);
}
```

---

### 9. Get Revenue by Event Name
**Function:** `getRevenueByEventName(eventName)`  
**Endpoint:** `GET /admin/Admin/getRevenueByEventName?eventName={name}`  
**Description:** Retrieves revenue for a specific event by name.

**Query Parameter:** `eventName` - The event name to search for

**Example URL:** `/admin/Admin/getRevenueByEventName?eventName=Spring%20Developer%20Conference`

**Response (200 OK):**
```json
{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventTicketPrice": 150,
  "totalRevenue": 45000
}
```

**Usage:**
```javascript
import { getRevenueByEventName } from '../services/authService';

const response = await getRevenueByEventName("Spring Developer Conference");
if (response.success) {
  console.log("Event revenue:", response.data.totalRevenue);
}
```

---

### 10. Get Revenue by Event ID
**Function:** `getRevenueByEventId(eventId)`  
**Endpoint:** `GET /admin/Admin/{eventId}/revenue`  
**Description:** Retrieves revenue for a specific event by ID.

**Path Variable:** `{eventId}` - The event ID

**Response (200 OK):**
```json
{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventTicketPrice": 150,
  "totalRevenue": 45000
}
```

**Usage:**
```javascript
import { getRevenueByEventId } from '../services/authService';

const response = await getRevenueByEventId(201);
if (response.success) {
  console.log("Event revenue:", response.data.totalRevenue);
}
```

---

## Admin User Management Implementation

### Component: `AdminUserManagement.js`

**Features Implemented:**

#### 1. Organizer List Display
- Fetches all organizers using `getAllOrganizers()`
- Displays in responsive Bootstrap table
- Shows: ID, Full Name, Email, Phone, Status, Created Date

#### 2. Status Management ⭐
- **Enable/Disable Toggle:**
  - Green "Enable" button for DISABLED organizers
  - Yellow "Disable" button for ACTIVE organizers
  - Confirmation dialog before status change
  - Real-time UI update after status change
  - Loading spinner during update

**Status Change Flow:**
```
User clicks "Disable" button
    ↓
Confirmation dialog appears
    ↓
User confirms
    ↓
Call updateUserStatus(userId, "DISABLED")
    ↓
API request: PATCH /admin/Admin/{userId}/status
    ↓
Backend updates user status
    ↓
Response received with updated user data
    ↓
Update local state (organizers array)
    ↓
UI updates: button changes to "Enable" (green)
    ↓
Success alert shown
```

#### 3. Statistics Cards
- **Total Organizers** - Count of all organizers
- **Active Organizers** - Count with status = "ACTIVE"
- **Disabled Organizers** - Count with status = "DISABLED"
- **Filtered Results** - Count of organizers matching filters

#### 4. Advanced Filtering
- **Search by Name:** Type organizer's name
- **Search by ID:** Click toggle button to switch to ID search
- **Status Filter:** Dropdown to filter by ACTIVE/DISABLED
- **Reset Filters:** Clear all filters with one click

#### 5. Error Handling
- Loading state with spinner
- Error display with retry button
- Empty state when no organizers found
- Network error handling

---

## Response Format

All API functions return a consistent response format:

```javascript
{
  success: boolean,      // true if response.ok (200-299)
  status: number,        // HTTP status code
  data: any,            // Response data from backend
  error: string | null  // Error message if !success
}
```

**Example Success Response:**
```javascript
{
  success: true,
  status: 200,
  data: [
    { userId: 1, fullName: "John Doe", ... }
  ],
  error: null
}
```

**Example Error Response:**
```javascript
{
  success: false,
  status: 401,
  data: null,
  error: "Session expired. Please login again."
}
```

---

## Error Handling

### JWT Token Validation
All admin API functions use `getAuthHeaders()` which:
1. Validates JWT token before making request
2. Throws error if token is expired
3. Automatically includes Authorization header
4. Clears localStorage if token is invalid

### Network Error Handling
```javascript
try {
  const response = await getAllOrganizers();
  if (!response.success) {
    throw new Error(response.error);
  }
  // Use response.data
} catch (error) {
  console.error("Error:", error.message);
  setError(error.message);
}
```

---

## Testing the Implementation

### 1. Test Organizer List
```javascript
// In browser console
const { getAllOrganizers } = await import('./services/authService');
const response = await getAllOrganizers();
console.log("Organizers:", response.data);
```

### 2. Test Status Update
```javascript
// In browser console
const { updateUserStatus } = await import('./services/authService');
const response = await updateUserStatus(101, "DISABLED");
console.log("Updated user:", response.data);
```

### 3. Test in UI
1. Navigate to `/admin/users`
2. Verify organizers table loads
3. Click "Disable" on an ACTIVE organizer
4. Confirm the action
5. Verify button changes to "Enable" (green)
6. Verify stats cards update
7. Click "Enable" to reactivate
8. Test search and filters

---

## API Endpoints Summary Table

| # | Method | Endpoint | Function | Description |
|---|--------|----------|----------|-------------|
| 1 | POST | `/admin/Admin` | `createAdminProfile()` | Create new admin |
| 2 | GET | `/admin/Admin/organizer` | `getAllOrganizers()` | Get all organizers |
| 3 | PUT | `/admin/Admin/events/{id}/approve` | `approveEvent()` | Approve event |
| 4 | PUT | `/admin/Admin/events/{id}/reject` | `rejectEvent()` | Reject event |
| 5 | PATCH | `/admin/Admin/{id}/status` | `updateUserStatus()` ⭐ | Update user status |
| 6 | GET | `/admin/Admin/events` | `getAllEventsAdmin()` | Get all events |
| 7 | GET | `/admin/Admin/username/{name}` | `findUsersByName()` | Search users by name |
| 8 | GET | `/admin/Admin/allrevenue` | `getAllEventRevenue()` | Get all event revenue |
| 9 | GET | `/admin/Admin/getRevenueByEventName` | `getRevenueByEventName()` | Get revenue by event name |
| 10 | GET | `/admin/Admin/{eventId}/revenue` | `getRevenueByEventId()` | Get revenue by event ID |

⭐ = Currently used in AdminUserManagement.js

---

## Usage Examples

### Enable/Disable Organizer (Complete Example)

```javascript
import React, { useState } from 'react';
import { updateUserStatus } from '../services/authService';

function OrganizerRow({ organizer, onStatusUpdated }) {
  const [updating, setUpdating] = useState(false);

  const handleToggleStatus = async () => {
    const newStatus = organizer.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirm = window.confirm(
      `Are you sure you want to ${newStatus === 'ACTIVE' ? 'enable' : 'disable'} this organizer?`
    );

    if (!confirm) return;

    try {
      setUpdating(true);
      const response = await updateUserStatus(organizer.userId, newStatus);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      alert(`Organizer ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'} successfully!`);
      onStatusUpdated(response.data);
    } catch (error) {
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <tr>
      <td>{organizer.fullName}</td>
      <td>
        <span className={`badge ${organizer.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
          {organizer.status}
        </span>
      </td>
      <td>
        <button
          className={`btn btn-sm ${organizer.status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
          onClick={handleToggleStatus}
          disabled={updating}
        >
          {updating ? 'Updating...' : (organizer.status === 'ACTIVE' ? 'Disable' : 'Enable')}
        </button>
      </td>
    </tr>
  );
}
```

---

## Migration Notes

### Before (Old Endpoints)
```javascript
// ❌ Old - incorrect endpoint
fetch('http://localhost:8080/Admin/organizer')

// ❌ Old - hardcoded fetch
const response = await fetch(`http://localhost:8080/Admin/${userId}/status`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ status: newStatus })
});
```

### After (New Endpoints)
```javascript
// ✅ New - correct endpoint with /admin prefix
import { getAllOrganizers, updateUserStatus } from '../services/authService';

// ✅ New - using centralized API function
const response = await getAllOrganizers();

// ✅ New - using centralized API function with automatic token handling
const response = await updateUserStatus(userId, newStatus);
```

---

## Benefits of This Implementation

### 1. Centralized API Management
- All admin endpoints in one place (`authService.js`)
- Consistent error handling across all functions
- Automatic JWT token validation
- Easy to update endpoints globally

### 2. Type Safety & Documentation
- Clear function signatures
- JSDoc comments (can be added)
- Consistent response format
- Easy to understand and maintain

### 3. Error Handling
- Network errors caught automatically
- Token expiry handled globally
- User-friendly error messages
- Automatic localStorage cleanup on auth errors

### 4. Reusability
- Functions can be imported anywhere
- No code duplication
- Easy to test
- Easy to mock for unit tests

### 5. Security
- Token validation before every request
- Automatic token cleanup on expiry
- Centralized auth header management
- HTTPS ready (when deployed)

---

## Next Steps

### Recommended Enhancements

1. **Add Event Approval UI**
   - Create `AdminEventApproval.js` component
   - Use `approveEvent()` and `rejectEvent()` functions
   - Display pending events
   - Add approve/reject buttons

2. **Add Revenue Dashboard**
   - Create `AdminRevenueDashboard.js` component
   - Use `getAllEventRevenue()` function
   - Display charts and graphs
   - Show revenue by event

3. **Add User Search**
   - Add search feature to AdminUserManagement
   - Use `findUsersByName()` function
   - Real-time search results
   - Highlight matching text

4. **Add Admin Creation UI**
   - Create form to add new admins
   - Use `createAdminProfile()` function
   - Validate input fields
   - Show success/error messages

5. **Add Event Management**
   - Use `getAllEventsAdmin()` function
   - Display all platform events
   - Filter by status (PENDING, APPROVED, REJECTED)
   - Approve/reject directly from table

---

## Troubleshooting

### Issue: "Network error. Please check your connection."
**Solution:**
- Verify backend is running on `http://localhost:8080`
- Check backend console for errors
- Verify `/admin/Admin/*` endpoints are configured correctly

### Issue: "Session expired. Please login again."
**Solution:**
- JWT token has expired (24 hours validity)
- Re-login to get new token
- Token is automatically validated before each request

### Issue: Organizers not loading
**Solution:**
- Check browser console for errors
- Verify you're logged in as ADMIN
- Check Network tab for API response
- Verify endpoint returns array of users

### Issue: Status update not working
**Solution:**
- Verify backend supports PATCH method
- Check request body format: `{ "status": "DISABLED" }`
- Verify userId is correct
- Check backend logs for errors

---

## Summary

✅ **All 10 admin API endpoints from AdminSetup.md implemented**  
✅ **Organizer status management (Enable/Disable) working**  
✅ **Correct endpoint paths: `/admin/Admin/*`**  
✅ **Centralized in `authService.js`**  
✅ **JWT token validation automatic**  
✅ **Consistent error handling**  
✅ **User-friendly UI with loading states**  
✅ **Real-time updates after status changes**  
✅ **Production-ready code**  

**The admin API integration is complete and ready to use!** 🎉
