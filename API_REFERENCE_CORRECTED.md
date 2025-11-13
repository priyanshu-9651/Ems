# API Reference - Corrected Endpoints

This document lists all the API endpoints that have been corrected in the service files to match the backend API documentation.

## Summary of Changes

### Event Service (`eventService.js`)
Fixed all endpoint paths to match the backend API:

#### Event Endpoints
- ✅ `POST /events/create/{organizerId}` - Create Event (was `/organizer/events/create/{organizerId}`)
- ✅ `GET /events` - Get All Events (was `/organizer/events`)
- ✅ `GET /events/{eventId}` - Get Event by ID (was `/organizer/events/{eventId}`)
- ✅ `PUT /events/{id}` - Update Event (was `/organizer/events/{id}`)
- ✅ `DELETE /events/{id}` - Delete Event (was `/organizer/events/{id}`)
- ✅ `GET /events/organizer/{organizerId}` - Get Events for Organizer (was `/organizer/events/organizer/{organizerId}`)
- ✅ `GET /events/organizer/{organizerId}/count` - Get Event Count (was `/organizer/events/organizer/{organizerId}/count`)
- ✅ `GET /events/ongoing` - Get All Ongoing Events (was `/organizer/events/ongoing`)
- ✅ `GET /events/organizer/{organizerId}/ongoing` - Get Organizer Ongoing Events (was `/organizer/events/organizer/{organizerId}/ongoing`)

#### Organizer Endpoints
- ✅ `GET /organizerProfile/{userId}` - Get Organizer Profile (was `/organizer/organizerProfile/{userId}`)
- ✅ `PATCH /{userId}` - Update User/Organizer Profile (NEW)
- ✅ `GET /all` - Get All Organizers (NEW)

#### Event Images Endpoints
- ✅ `POST /event-images/upload` - Upload Event Image (was `/organizer/event-images/upload`)
- ✅ `GET /event-images/event/{eventId}` - Get Event Images (was `/organizer/event-images/event/{eventId}`)
- ✅ `DELETE /event-images/{imageId}` - Delete Event Image (was `/organizer/event-images/{imageId}`)
- ✅ `POST /event-images` - Add Event Image with Manual Path (NEW)

#### Booking Endpoints
- ✅ `GET /bookings/customer/{customerId}` - Get Customer Bookings (was `/customer/api/bookings/customer/{customerId}`)
- ✅ `GET /bookings/customer/{customerId}/event/{eventId}` - Get Customer Bookings for Event (NEW)
- ✅ `GET /bookings/organizer/{organizerId}` - Get Organizer Bookings (NEW)
- ✅ `GET /bookings/organizer/{organizerId}/event/{eventId}` - Get Organizer Bookings for Event (NEW)
- ✅ `DELETE /bookings/{id}` - Cancel Booking (NEW)
- ✅ `POST /customer/api/bookings` - Create Booking (unchanged)
- ✅ `GET /customer/api/events/{eventId}/details` - Get Event Details (unchanged)
- ✅ `GET /customer/api/bookings/event/{eventId}/booked-seats` - Get Booked Seats (unchanged)

#### Feedback Endpoints
- ✅ `GET /feedbacks/event/{eventId}` - Get Event Feedback (NEW)

#### Admin Endpoints
- ✅ `GET /events` - Get All Events for Admin (was `/organizer/events`)
- ✅ `GET /events/count` - Get Total Event Count (was `/organizer/events/count`)
- ✅ `GET /events/ongoing` - Get All Ongoing Events (was `/organizer/events/ongoing`)
- ✅ `GET /bookings` - Get All Bookings (was `/organizer/bookings`)
- ✅ `GET /bookings/event/{eventId}` - Get Bookings by Event (was `/organizer/bookings/event/{eventId}`)

### Auth Service (`authService.js`)
Fixed all endpoint paths to match the backend API:

#### Organizer Endpoints
- ✅ `POST /signup` - Register Organizer (NEW - separate from user signup)
- ✅ `POST /organizerProfile` - Create Organizer Profile (was `/organizer/organizerProfile`)
- ✅ `GET /organizerProfile/{userId}` - Get Organizer Profile (was `/organizer/organizerProfile/{userId}`)
- ✅ `PATCH /{userId}` - Update User Details (NEW)
- ✅ `GET /all` - Get All Organizer Users (NEW)

#### Admin Endpoints (unchanged)
- ✅ `POST /admin/Admin` - Create Admin Profile
- ✅ `GET /admin/Admin/user/{userId}` - Get Admin Profile
- ✅ `GET /admin/Admin/organizer` - Get All Organizers
- ✅ `PUT /admin/Admin/events/{id}/approve` - Approve Event
- ✅ `PUT /admin/Admin/events/{id}/reject` - Reject Event
- ✅ `PATCH /admin/Admin/{id}/status` - Update User Status
- ✅ `GET /admin/Admin/events` - Get All Events
- ✅ `GET /admin/Admin/username/{fullName}` - Find Users by Name
- ✅ `GET /admin/Admin/allrevenue` - Get All Event Revenue
- ✅ `GET /admin/Admin/getRevenueByEventName` - Get Revenue by Event Name
- ✅ `GET /admin/Admin/{eventId}/revenue` - Get Revenue by Event ID

## New Functions Added

### eventService.js
1. `updateUserProfile(userId, patchData)` - PATCH user details
2. `getAllOrganizers()` - Get all organizer users
3. `getCustomerBookingsForEvent(customerId, eventId)` - Get customer bookings for specific event
4. `getOrganizerBookings()` - Get all bookings for current organizer
5. `getOrganizerBookingsForEvent(eventId)` - Get bookings for specific event
6. `cancelBooking(bookingId)` - Cancel a booking
7. `addEventImage(imagePath, eventId, imageType)` - Add event image with manual path
8. `getEventFeedback(eventId)` - Get feedback for an event

### authService.js
1. `registerOrganizer(name, email, password, phone)` - Register new organizer
2. `updateUserDetails(userId, patchData)` - Update user details
3. `getAllOrganizerUsers()` - Get all organizer users

## API Endpoint Base Paths

According to the Eventorganizer.md documentation:

- **Organizer Controller**: No base path (endpoints start with `/`)
  - `/signup`, `/all`, `/organizerProfile`, `/{id}`
  
- **Event Controller**: `/events`
  - `/events/create/{id}`, `/events`, `/events/{eventId}`, etc.
  
- **Booking Controller**: `/bookings`
  - `/bookings/customer/{customerId}`, `/bookings/organizer/{organizerId}`, etc.
  
- **Event Images Controller**: `/event-images`
  - `/event-images/upload`, `/event-images/event/{eventId}`, etc.
  
- **Feedback Controller**: `/feedbacks`
  - `/feedbacks/event/{eventId}`
  
- **Customer API**: `/customer/api`
  - `/customer/api/events/{eventId}/details`, `/customer/api/bookings`, etc.
  
- **Admin API**: `/admin/Admin`
  - `/admin/Admin`, `/admin/Admin/events`, `/admin/Admin/allrevenue`, etc.

## Notes

1. **Public Endpoints**: The following endpoints are marked as `public: true` (no authentication required):
   - `GET /events` - Get All Events
   - `GET /events/{eventId}` - Get Event by ID
   - `GET /event-images/event/{eventId}` - Get Event Images
   - `GET /customer/api/events/{eventId}/details` - Get Event Details
   - `GET /customer/api/bookings/event/{eventId}/booked-seats` - Get Booked Seats

2. **Currency**: All price displays have been updated to use "Rs." (Rupees) instead of "$"

3. **DateTime Format**: Event dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss`

4. **Seat Layout**: Empty `seatLayout` strings are properly handled with safe JSON parsing

5. **Event Types**: Both seated (with seat map) and non-seated (quantity only) events are supported

## Testing Recommendations

1. Test all event CRUD operations with the corrected paths
2. Verify organizer profile creation and retrieval
3. Test booking creation for both seated and non-seated events
4. Verify organizer can view their bookings
5. Test event image upload and retrieval
6. Verify feedback retrieval for events
7. Test admin endpoints for event approval/rejection
8. Verify revenue endpoints return correct data

## Migration Notes

If you have existing components using the old API paths, they will automatically use the corrected paths now. However, you should:

1. Clear browser localStorage if you notice authentication issues
2. Test the booking flow end-to-end
3. Verify event creation and editing work correctly
4. Check that images upload and display properly
5. Test organizer dashboard bookings view
