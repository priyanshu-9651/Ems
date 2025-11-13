Here is the API documentation for the **customer-app** microservice.

-----

## 🎟️ Booking API

Base Path: `/api/bookings`

### 1\. Create a New Booking

Creates a new booking for an event. This single endpoint handles both seated and non-seated events.

  * **Method:** `POST`
  * **Endpoint:** `/api/bookings`

**Request Body (`BookingRequestDto`)**

```json
{
  "eventId": 1,
  "customerId": 1,
  
  // --- Case 1: For a seated event ---
  // (eventRequiresSeat = true)
  "selectedSeats": ["A1", "A2"],
  "ticketsQuantity": null, // Can be null or 0

  // --- Case 2: For a general admission event ---
  // (eventRequiresSeat = false)
  "selectedSeats": null, // Can be null or []
  "ticketsQuantity": 2
}
```

**Success Response (201 CREATED)**
Returns the complete booking object with ticket details.

```json
{
  "bookingId": 1,
  "ticketsQuantity": 2,
  "totalAmount": 1000,
  "bookingStatus": "CONFIRMED",
  "createdAt": "2025-11-13T10:00:00.000Z",
  "eventId": 1,
  "eventName": "Tech Conference 2025",
  "customerId": 1,
  "tickets": [
    {
      "ticketId": 1,
      "seatNumber": "A1"
    },
    {
      "ticketId": 2,
      "seatNumber": "A2"
    }
  ]
}
```

**Error Responses (400 BAD REQUEST)**

  * If validation fails (e.g., `eventId` is missing):
    ```json
    {
      "eventId": "Event ID is required"
    }
    ```
  * If seats are already taken:
    ```json
    {
      "error": "Seat A1 is already booked."
    }
    ```
  * If not enough general admission tickets are available:
    ```json
    {
      "error": "Not enough tickets available."
    }
    ```

### 2\. Get Bookings for a Customer

Gets a list of all past and upcoming bookings for a specific customer.

  * **Method:** `GET`
  * **Endpoint:** `/api/bookings/customer/{customerId}`

**Success Response (200 OK)**
Returns a list of booking objects.

```json
[
  {
    "bookingId": 1,
    "ticketsQuantity": 2,
    "totalAmount": 1000,
    // ... other fields ...
    "eventName": "Tech Conference 2025",
    "tickets": [
      { "ticketId": 1, "seatNumber": "A1" },
      { "ticketId": 2, "seatNumber": "A2" }
    ]
  },
  {
    "bookingId": 5,
    "ticketsQuantity": 1,
    "totalAmount": 300,
    // ... other fields ...
    "eventName": "Music Concert",
    "tickets": [
      { "ticketId": 7, "seatNumber": "GA-12" }
    ]
  }
]
```

### 3\. Get Booked Seats for an Event

Gets a list of all seat numbers that are already booked for an event. This is **essential** for the frontend to render the seat map correctly, showing which seats are "blocked" or unavailable.

  * **Method:** `GET`
  * **Endpoint:** `/api/bookings/event/{eventId}/booked-seats`

**Success Response (200 OK)**
Returns a simple array of strings.

```json
[ "A1", "A2", "C5", "C6", "C7", "F10" ]
```

-----

## 📅 Event API

Base Path: `/api/events`

### 1\. Get Event Details for Booking Page

Gets the specific information needed to build the seat selection page: the event's name, price, and (if it exists) the seat layout JSON.

  * **Method:** `GET`
  * **Endpoint:** `/api/events/{eventId}/details`

**Success Response (200 OK)**

  * **For a seated event:**
    ```json
    {
      "eventId": 1,
      "eventName": "Tech Conference 2025",
      "eventTicketPrice": 500,
      "seatLayout": "{ \"rows\": [...] }" // The JSON string for the seat map
    }
    ```
  * **For a general admission event:**
    ```json
    {
      "eventId": 2,
      "eventName": "Music Concert",
      "eventTicketPrice": 300,
      "seatLayout": null
    }
    ```

-----

## 👤 Customer API

Base Path: `/api/customers`

### 1\. Create Customer Profile

Creates a new customer profile. This should be called after a user signs up in the `auth-app` and is filling out their profile for the first time.

  * **Method:** `POST`
  * **Endpoint:** `/api/customers`

**Request Body (`CustomerDto`)**

```json
{
  "userId": 123, // The ID from the auth-service's User object
  "address": "123 Main St",
  "city": "Anytown",
  "state": "Anystate",
  "zipCode": "12345",
  "country": "Country",
  "gender": "Female",
  "dob": "1990-05-15",
  "anniversary": null
}
```

**Success Response (200 OK)**
Returns the newly created customer object with its `customerId`.

```json
{
  "customerId": 1,
  "userId": 123,
  "address": "123 Main St",
  // ... all other fields
}
```

### 2\. Get Customer Profile by User ID

Gets the customer's profile information using their **User ID** (from the auth service). This is the most common way you will fetch a logged-in user's profile.

  * **Method:** `GET`
  * **Endpoint:** `/api/customers/user/{userId}`

**Success Response (200 OK)**

```json
{
  "customerId": 1,
  "userId": 123,
  "address": "123 Main St",
  // ... all other fields
}
```

**Error Response (404 NOT FOUND)**

```json
{
  "error": "Customer profile not found for user id: 123"
}
```

### 3\. Get Customer Profile by Customer ID

Gets a customer's profile using their unique `customerId`.

  * **Method:** `GET`
  * **Endpoint:** `/api/customers/{id}`

**Success Response (200 OK)**

```json
{
  "customerId": 1,
  "userId": 123,
  "address": "123 Main St",
  // ... all other fields
}
```

### 4\. Update Customer Profile

Updates an existing customer's profile.

  * **Method:** `PUT`
  * **Endpoint:** `/api/customers/{id}`

**Request Body (`CustomerDto`)**

```json
{
  "userId": 123,
  "address": "456 New Ave", // Updated address
  "city": "New City",
  // ... all other fields must be included
}
```

**Success Response (200 OK)**
Returns the complete, updated customer object.

```json
{
  "customerId": 1,
  "userId": 123,
  "address": "456 New Ave",
  "city": "New City",
  // ...
}
```