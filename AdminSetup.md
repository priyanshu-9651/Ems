Click the Copy icon in the top-right corner of the code block, then paste it into a file named admin_api_v2.md.

Markdown

# Admin Service API Documentation (v2)

## 📍 Base URL

Based on your `application.properties` and `AdminController`, all API paths are prefixed with the server context path (`/admin`) and the controller mapping (`/Admin`).

**The full base for all endpoints is:** `/admin/Admin`

---

## 📦 Data Models (DTOs)

These are the primary JSON structures used in the request and response bodies.

### 1. `UserDto`
Used for representing user data.

```json
{
  "userId": 101,
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "555-1234",
  "role": "ORGANIZER",
  "status": "ACTIVE",
  "createdAt": "2025-11-10T10:30:00"
}
2. EventDto
Used for representing event data.

JSON

{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventDescr": "A conference for Spring developers.",
  "eventStartDate": "2026-05-10",
  "eventEndDate": "2026-05-12",
  "eventLocation": "Convention Center",
  "eventCategory": "Technology",
  "eventType": "Conference",
  "eventStatus": "APPROVED",
  "eventMode": "In-Person",
  "eventRequiresSeat": true,
  "eventTicketPrice": 150,
  "eventTotalSeats": 500,
  "eventApprovedBy": null,
  "eventApprovedAt": "2025-11-11T08:00:00",
  "eventCreatedAt": "2025-11-01T14:20:00",
  "eventUpdatedAt": "2025-11-11T08:00:00"
}
3. EventRevenueDTO
Used for financial reports.

JSON

{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventTicketPrice": 150,
  "totalRevenue": 45000
}
Endpoints
Here is the detailed breakdown of each API endpoint with the full path.

1. Add a New Admin
Method: POST

Path: /admin/Admin

Description: Creates a new user with the "Admin" role.

Request Body: (Based on the User entity)

JSON

{
  "fullName": "New Admin User",
  "email": "admin@example.com",
  "password": "a-strong-password",
  "phone": "555-0000",
  "role": "Admin"
}
Response Body (Success 201 CREATED): (Returns the created User entity)

JSON

{
  "userId": 102,
  "fullName": "New Admin User",
  "email": "admin@example.com",
  "phone": "555-0000",
  "role": "Admin",
  "status": "ACTIVE",
  "createdAt": "2025-11-11T09:00:00"
}
2. Get All Event Organizers
Method: GET

Path: /admin/Admin/organizer

Description: Retrieves a list of all users with the "ORGANIZER" role.

Request Body: (None)

Response Body (Success 200 OK): (A list of UserDto objects)

JSON

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
3. Approve an Event
Method: PUT

Path: /admin/Admin/events/{id}/approve

Description: Approves a pending event, changing its status to "APPROVED".

Path Variable: {id} (int) - The ID of the event to approve.

Request Body: (None)

Response Body (Success 200 OK): (The updated EventDto)

JSON

{
  "eventId": 202,
  "eventName": "Pending Tech Meetup",
  "eventStatus": "APPROVED",
  // ... all other EventDto fields
}
4. Reject an Event
Method: PUT

Path: /admin/Admin/events/{id}/reject

Description: Rejects a pending event, changing its status to "REJECTED".

Path Variable: {id} (int) - The ID of the event to reject.

Request Body: (Optional) A plain text string with the reason for rejection.

"Venue details incomplete"
Response Body (Success 200 OK): (The updated EventDto)

JSON

{
  "eventId": 202,
  "eventName": "Pending Tech Meetup",
  "eventStatus": "REJECTED: Venue details incomplete",
  // ... all other EventDto fields
}
5. Update User Status (Enable/Disable)
Method: PATCH

Path: /admin/Admin/{id}/status

Description: Updates the status of any user (e.g., to "ACTIVE" or "DISABLED").

Path Variable: {id} (int) - The ID of the user to update.

Request Body: A JSON object with the "status" key.

JSON

{
  "status": "DISABLED"
}
Response Body (Success 200 OK): (The updated UserDto)

JSON

{
  "userId": 101,
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "status": "DISABLED",
  // ... all other UserDto fields
}
6. Get All Events
Method: GET

Path: /admin/Admin/events

Description: Retrieves a list of all events, regardless of status.

Request Body: (None)

Response Body (Success 200 OK): (A list of EventDto objects)

JSON

[
  {
    "eventId": 201,
    "eventName": "Spring Developer Conference",
    "eventStatus": "APPROVED",
    // ... all other EventDto fields
  },
  {
    "eventId": 202,
    "eventName": "Pending Tech Meetup",
    "eventStatus": "PENDING",
    // ... all other EventDto fields
  }
]
7. Find Users by Name
Method: GET

Path: /admin/Admin/username/{fullName}

Description: Searches for users whose full name contains the provided string.

Path Variable: {fullName} (String) - The search term (e.g., "Jane").

Request Body: (None)

Response Body (Success 200 OK): (A list of UserDto objects)

JSON

[
  {
    "userId": 101,
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "ORGANIZER",
    "status": "ACTIVE",
    "createdAt": "2025-11-10T10:30:00"
  }
]
8. Get All Event Revenue
Method: GET

Path: /admin/Admin/allrevenue

Description: Retrieves a revenue report for all events.

Request Body: (None)

Response Body (Success 200 OK): (A list of EventRevenueDTO objects)

JSON

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
9. Get Revenue by Event Name
Method: GET

Path: /admin/Admin/getRevenueByEventName

Description: Retrieves a revenue report for a specific event by its name.

Query Parameter: eventName (String) - The name of the event to search for.

Example URL: /admin/Admin/getRevenueByEventName?eventName=Spring%20Developer%2BConference

Request Body: (None)

Response Body (Success 200 OK): (A single EventRevenueDTO)

JSON

{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventTicketPrice": 150,
  "totalRevenue": 45000
}
10. Get Revenue by Event ID
Method: GET

Path: /admin/Admin/{eventId}/revenue

Description: Retrieves a revenue report for a specific event by its ID.

Path Variable: {eventId} (int) - The ID of the event.

Request Body: (None)

Response Body (Success 200 OK): (A single EventRevenueDTO)

JSON

{
  "eventId": 201,
  "eventName": "Spring Developer Conference",
  "eventTicketPrice": 150,
  "totalRevenue": 45000
}