Here is a complete API documentation in Markdown format, based on all the controllers, DTOs, entities, and security configurations you provided.

I've analyzed all 32 files to build this, cross-referencing your `SecurityConfig.java` with your controllers to determine the correct authorization for each endpoint.

-----

# Event Organizer App - API Documentation

This document details the API endpoints for the Event Organizer service.

## Authentication

All secured endpoints expect a **Bearer Token** in the `Authorization` header. The token is a JWT.

**Header Format:**

```
Authorization: Bearer <your_jwt_token>
```

Endpoints marked as `permitAll` do not require this header.

-----

## 🏛️ Organizer Controller

**Note on Security:** Your `SecurityConfig.java` has rules like `"/organizer/organizerProfile"` and `"/organizer/**"`. However, your `OrganizerController.java` does not have a class-level `@RequestMapping("/organizer")`. This means:

  * `POST /organizerProfile` and `GET /organizerProfile/{id}` **are** secured correctly as you intended.
  * `POST /signup`, `GET /all`, and `PATCH /{id}` are **not** matched by your specific `"/organizer/..."` rules. They fall under the `anyRequest().authenticated()` rule, meaning any authenticated user can access them, which may not be what you intended.

### `POST /signup`

  * **Description:** Registers a new user, intended to be an organizer.
  * **Authorization:** `authenticated` (See note above)
  * **Request Body:** `UserRequestDTO`
    ```json
    {
      "fullName": "New Organizer",
      "email": "organizer@example.com",
      "password": "password123",
      "phone": "9876543210",
      "role": "EVENT_ORGANIZER",
      "status": "PENDING"
    }
    ```
  * **Response Body (200 OK):** `UserResponseDTO`
    ```json
    {
      "userId": 5,
      "fullName": "New Organizer",
      "email": "organizer@example.com",
      "phone": "9876543210",
      "role": "Organizer",
      "status": "PENDING",
      "createdAt": "2025-11-10T14:30:00"
    }
    ```
  * **Response Body (Error):**
    ```json
    {
      "message": "Email already exists"
    }
    ```

### `GET /all`

  * **Description:** Gets a list of all users with the role "EVENT\_ORGANIZER".
  * **Authorization:** `authenticated` (See note above)
  * **Response Body (200 OK):** `List<UserResponseDTO>`
    ```json
    [
      {
        "userId": 5,
        "fullName": "New Organizer",
        "email": "organizer@example.com",
        "phone": "9876543210",
        "role": "EVENT_ORGANIZER",
        "status": "ACTIVE",
        "createdAt": "2025-11-10T14:30:00"
      }
    ]
    ```

### `POST /organizerProfile`

  * **Description:** Adds or updates the professional profile for an existing organizer user.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Request Body:** `OrganizerRequestDTO`
    ```json
    {
      "organisationName": "Awesome Events Inc.",
      "contactPerson": "Jane Doe",
      "contactPersonPhone": "1234567890",
      "email": "organizer@example.com"
    }
    ```
  * **Response Body (200 OK):** `OrganizerResponseDTO`
    ```json
    {
      "organizerId": 1,
      "organisationName": "Awesome Events Inc.",
      "contactPerson": "Jane Doe",
      "contactPersonPhone": "1234567890",
      "createdAt": "2025-11-10T14:35:00",
      "updatedAt": "2025-11-10T14:35:00",
      "userId": 5
    }
    ```

### `GET /organizerProfile/{id}`

  * **Description:** Gets the professional profile of an organizer by their **User ID**.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variable:**
      * `id` (int): The `userId` of the organizer.
  * **Response Body (200 OK):** `OrganizerResponseDTO`
    ```json
    {
      "organizerId": 1,
      "organisationName": "Awesome Events Inc.",
      "contactPerson": "Jane Doe",
      "contactPersonPhone": "1234567890",
      "createdAt": "2025-11-10T14:35:00",
      "updatedAt": "2025-11-10T14:35:00",
      "userId": 5
    }
    ```
  * **Response (404 Not Found):** Empty body.

### `PATCH /{id}`

  * **Description:** Partially updates a user's details (full name, phone, or status).
  * **Authorization:** `authenticated` (See note above)
  * **Path Variable:**
      * `id` (int): The `userId` to patch.
  * **Request Body:** `UserPatchRequestDTO` (File not provided, but inferred from `OrganizerServiceImpl.java`)
    ```json
    {
      "status": "ACTIVE",
      "phone": "1122334455"
    }
    ```
  * **Response Body (200 OK):** `UserResponseDTO`
    ```json
    {
      "userId": 5,
      "fullName": "New Organizer",
      "email": "organizer@example.com",
      "phone": "1122334455",
      "role": "EVENT_ORGANIZER",
      "status": "ACTIVE",
      "createdAt": "2025-11-10T14:30:00"
    }
    ```

-----

## 🗓️ Event Controller

Base Path: `/events`

### `POST /events/create/{id}`

  * **Description:** Creates a new event for a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variable:**
      * `id` (int): The `organizerId` of the event creator.
  * **Request Body:** `EventRequestDTO`
    ```json
    {
      "eventName": "Spring Boot Conference",
      "eventDescr": "A deep dive into Spring Boot 3.",
      "eventStartDate": "2026-05-20T09:00:00",
      "eventEndDate": "2026-05-21T17:00:00",
      "eventLocation": "Convention Center",
      "eventCategory": "Tech",
      "eventType": "Conference",
      "eventStatus": "DRAFT",
      "eventMode": "IN_PERSON",
      "eventRequiresSeat": true,
      "eventTicketPrice": 150,
      "eventTotalSeats": 500,
      "seatLayout": "{...json...}"
    }
    ```
  * **Response Body (201 Created):** `EventResponseDTO` (Inferred from `EventServiceImpl.java` and `Event.java`)
    ```json
    {
      "eventId": 101,
      "eventName": "Spring Boot Conference",
      "eventDescr": "A deep dive into Spring Boot 3.",
      "eventStartDate": "2026-05-20T09:00:00",
      "eventEndDate": "2026-05-21T17:00:00",
      "eventLocation": "Convention Center",
      "eventCategory": "Tech",
      "eventType": "Conference",
      "eventStatus": "DRAFT",
      "eventMode": "IN_PERSON",
      "eventRequiresSeat": true,
      "eventTicketPrice": 150,
      "eventTotalSeats": 500,
      "seatLayout": "{...json...}",
      "organizerId": 1
    }
    ```

### `GET /events`

  * **Description:** Gets a list of all events from all organizers.
  * **Authorization:** `permitAll`
  * **Response Body (200 OK):** `List<EventResponseDTO>`

### `GET /events/{eventId}`

  * **Description:** Gets a single event by its ID.
  * **Authorization:** `permitAll`
  * **Path Variable:**
      * `eventId` (int): The ID of the event.
  * **Response Body (200 OK):** `EventResponseDTO`
  * **Response (404 Not Found):** Empty body.

### `PUT /events/{id}`

  * **Description:** Updates an existing event.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variable:**
      * `id` (int): The `eventId` to update.
  * **Request Body:** `EventRequestDTO` (Same as create)
  * **Response Body (200 OK):** `EventResponseDTO`

### `DELETE /events/{id}`

  * **Description:** Deletes an event.
  * **Authorization:** `EVENT_ORGANIZER`, `ADMIN`
  * **Path Variable:**
      * `id` (int): The `eventId` to delete.
  * **Response (204 No Content):** Empty body.

### `GET /events/organizer/{organizerId}`

  * **Description:** Gets all events for a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`, `ADMIN`
  * **Path Variable:**
      * `organizerId` (int): The ID of the organizer.
  * **Response Body (200 OK):** `List<EventResponseDTO>`

### `GET /events/organizer/{organizerId}/count`

  * **Description:** Gets the total count of events for a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`, `ADMIN`
  * **Path Variable:**
      * `organizerId` (int): The ID of the organizer.
  * **Response Body (200 OK):** `long`
    ```
    5
    ```

### `GET /events/organizer/{organizerId}/ongoing`

  * **Description:** Gets all "ONGOING" events for a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`, `ADMIN`
  * **Path Variable:**
      * `organizerId` (int): The ID of the organizer.
  * **Response Body (200 OK):** `List<EventResponseDTO>`

-----

## 🎟️ Booking Controller

Base Path: `/bookings`

### `GET /bookings/customer/{customerId}`

  * **Description:** Gets all bookings for a specific customer.
  * **Authorization:** `CUSTOMER`
  * **Path Variable:**
      * `customerId` (int): The customer's ID.
  * **Response Body (200 OK):** `List<BookingResponseDTO>`

### `GET /bookings/customer/{customerId}/event/{eventId}`

  * **Description:** Gets all bookings for a specific customer for a specific event.
  * **Authorization:** `CUSTOMER`
  * **Path Variables:**
      * `customerId` (int): The customer's ID.
      * `eventId` (int): The event's ID.
  * **Response Body (200 OK):** `List<BookingResponseDTO>`

### `GET /bookings/organizer/{organizerId}`

  * **Description:** Gets all bookings for all events managed by a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variable:**
      * `organizerId` (int): The organizer's ID.
  * **Response Body (200 OK):** `List<BookingResponseDTO>`

### `GET /bookings/organizer/{organizerId}/event/{eventId}`

  * **Description:** Gets all bookings for a specific event managed by a specific organizer.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variables:**
      * `organizerId` (int): The organizer's ID.
      * `eventId` (int): The event's ID.
  * **Response Body (200 OK):** `List<BookingResponseDTO>`

### `DELETE /bookings/{id}`

  * **Description:** Cancels a booking (sets status to "CANCELLED").
  * **Authorization:** `CUSTOMER`, `ADMIN`
  * **Path Variable:**
      * `id` (int): The `bookingId` to cancel.
  * **Response (204 No Content):** Empty body.

-----

## 🖼️ Event Images Controller

Base Path: `/event-images`

### `POST /event-images/upload`

  * **Description:** Uploads an event image file and saves its path to the database.
  * **Authorization:** `EVENT_ORGANIZER`
  * **Request:** `multipart/form-data`
      * `file` (File): The image file to upload.
      * `eventId` (int): The ID of the event.
      * `imageType` (String): e.g., "BANNER", "THUMBNAIL".
  * **Response Body (201 Created):** `EventImagesResponseDTO` (File not provided, but inferred from `EventImagesController.java`)
    ```json
    {
      "imageId": 1,
      "imagePath": "/uploads/a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6.png",
      "imageType": "BANNER",
      "eventId": 101
    }
    ```

### `POST /event-images`

  * **Description:** Adds an event image by manually providing a path (e.g., external URL).
  * **Authorization:** `EVENT_ORGANIZER`
  * **Request Body:** `EventImagesRequestDTO` (File not provided, but inferred from `EventImagesController.java`)
    ```json
    {
      "imagePath": "https://example.com/external-image.jpg",
      "eventId": 101,
      "imageType": "GALLERY"
    }
    ```
  * **Response Body (201 Created):** `EventImagesResponseDTO`

### `GET /event-images/event/{eventId}`

  * **Description:** Gets all image paths for a specific event.
  * **Authorization:** `permitAll`
  * **Path Variable:**
      * `eventId` (int): The ID of the event.
  * **Response Body (200 OK):** `List<EventImagesResponseDTO>`

### `DELETE /event-images/{id}`

  * **Description:** Deletes an event image reference from the database. (Note: This does not delete the file from the disk).
  * **Authorization:** `EVENT_ORGANIZER`
  * **Path Variable:**
      * `id` (int): The `imageId` to delete.
  * **Response (204 No Content):** Empty body.

-----

## 🗣️ Feedback Controller

Base Path: `/feedbacks`

### `GET /feedbacks/event/{eventId}`

  * **Description:** Gets all feedback for a specific event.
  * **Authorization:** `authenticated`
  * **Path Variable:**
      * `eventId` (int): The ID of the event.
  * **Response Body (200 OK):** `List<FeedbackResponseDTO>` (File not provided, but inferred from `FeedbackController.java`)

-----

## 📁 Static Content

### `GET /uploads/**`

  * **Description:** Serves static files (like event images) from the server's file system.
  * **Authorization:** `permitAll`
  * **Example URL:** `http://localhost:8080/uploads/a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6.png`
  * **Response:** The raw file (e.g., `image/png`).