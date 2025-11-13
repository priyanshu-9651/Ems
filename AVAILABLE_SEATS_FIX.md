# 🎫 Fix for "500/500" Seats Display Issue

**Date:** November 13, 2025  
**Issue:** Event listing and details pages showing static seat counts instead of real-time available seats
**Status:** ✅ FRONTEND FIXED - ⚠️ BACKEND ACTION REQUIRED

---

## 🔍 Problem Identified

### Symptoms:
- Events page showing "500/500" or "totalSeats/totalSeats" for all events
- Event details page showing full capacity even after bookings
- Available seats not updating in real-time

### Root Cause:
The backend API is **NOT returning `eventSeatsAvailable`** field in the events list response. The frontend was falling back to `eventTotalSeats`, showing full capacity.

---

## ✅ Frontend Fixes Applied

### 1. Fixed `EventsPage.js`

**Before:**
```javascript
availableSeats: event.eventTotalSeats, // Always shows total!
```

**After:**
```javascript
availableSeats: event.eventSeatsAvailable ?? event.eventTotalSeats,
```

Now prioritizes `eventSeatsAvailable` from API, falls back to total only if not provided.

---

### 2. Fixed `EventDetails.js`

**Before:**
```javascript
<strong>Available Seats:</strong> {event.availableSeats}/{event.totalSeats}
```

**After:**
```javascript
<strong>Available Seats:</strong> {event.availableSeats ?? event.eventSeatsAvailable ?? event.totalSeats}/{event.totalSeats ?? event.eventTotalSeats}
```

Now handles multiple field name formats and provides fallbacks.

---

## ⚠️ **BACKEND ACTION REQUIRED**

### What the Backend Must Do:

#### 1. Add `eventSeatsAvailable` to Event Entity/DTO

Your Event model should have:

```java
@Entity
public class Event {
    // ...existing fields...
    
    @Column(name = "event_total_seats")
    private Integer eventTotalSeats;
    
    @Column(name = "event_seats_available")  // ← ADD THIS
    private Integer eventSeatsAvailable;
    
    // Getters and setters...
}
```

---

#### 2. Initialize `eventSeatsAvailable` When Creating Event

```java
public Event createEvent(EventDto eventDto) {
    Event event = new Event();
    // ...set other fields...
    event.setEventTotalSeats(eventDto.getEventTotalSeats());
    event.setEventSeatsAvailable(eventDto.getEventTotalSeats()); // Initialize to total
    
    return eventRepository.save(event);
}
```

---

#### 3. Decrement `eventSeatsAvailable` When Booking is Created

```java
@Transactional
public Booking createBooking(BookingRequestDto bookingDto) {
    Event event = eventRepository.findById(bookingDto.getEventId())
        .orElseThrow(() -> new RuntimeException("Event not found"));
    
    int ticketsToBook = 0;
    
    if (bookingDto.getSelectedSeats() != null && !bookingDto.getSelectedSeats().isEmpty()) {
        // Seated event
        ticketsToBook = bookingDto.getSelectedSeats().size();
    } else if (bookingDto.getTicketsQuantity() != null) {
        // Non-seated event
        ticketsToBook = bookingDto.getTicketsQuantity();
    }
    
    // Check availability
    if (event.getEventSeatsAvailable() < ticketsToBook) {
        throw new RuntimeException("Not enough seats available");
    }
    
    // Create booking
    Booking booking = new Booking();
    // ...set booking fields...
    booking = bookingRepository.save(booking);
    
    // ✅ DECREMENT AVAILABLE SEATS
    event.setEventSeatsAvailable(event.getEventSeatsAvailable() - ticketsToBook);
    eventRepository.save(event);
    
    return booking;
}
```

---

#### 4. Increment `eventSeatsAvailable` When Booking is Cancelled

```java
@Transactional
public void cancelBooking(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));
    
    Event event = eventRepository.findById(booking.getEventId())
        .orElseThrow(() -> new RuntimeException("Event not found"));
    
    int ticketsToRelease = booking.getTicketsQuantity();
    
    // ✅ INCREMENT AVAILABLE SEATS
    event.setEventSeatsAvailable(event.getEventSeatsAvailable() + ticketsToRelease);
    eventRepository.save(event);
    
    booking.setBookingStatus("CANCELLED");
    bookingRepository.save(booking);
}
```

---

#### 5. Include `eventSeatsAvailable` in ALL API Responses

**❌ Current API Response (Missing field):**
```json
{
  "eventId": 4,
  "eventName": "Tech Conference",
  "eventTicketPrice": 234,
  "eventTotalSeats": 500
}
```

**✅ Required API Response:**
```json
{
  "eventId": 4,
  "eventName": "Tech Conference",
  "eventTicketPrice": 234,
  "eventTotalSeats": 500,
  "eventSeatsAvailable": 453  // ← MUST INCLUDE THIS
}
```

This field must be included in:
- `GET /organizer/events` (List all events)
- `GET /organizer/events/{id}` (Get event by ID)
- `GET /customer/api/events/{id}/details` (Get event details for booking)

---

## 📊 Expected Behavior After Fix

### Scenario 1: Fresh Event (No Bookings)
**Database:**
- `eventTotalSeats` = 500
- `eventSeatsAvailable` = 500

**UI Display:** "500/500" ✅

---

### Scenario 2: Event with 47 Tickets Booked
**Database:**
- `eventTotalSeats` = 500
- `eventSeatsAvailable` = 453

**UI Display:** "453/500" ✅

---

### Scenario 3: Sold Out Event
**Database:**
- `eventTotalSeats` = 500
- `eventSeatsAvailable` = 0

**UI Display:** "0/500" ✅ (Shows "Sold Out" message)

---

## 🧪 Testing Steps

### Backend Testing:

1. **Create a test event with 10 seats:**
   ```sql
   INSERT INTO events (event_name, event_total_seats, event_seats_available) 
   VALUES ('Test Event', 10, 10);
   ```

2. **Book 3 tickets:**
   ```
   POST /customer/api/bookings
   {
     "eventId": 1,
     "customerId": 1,
     "ticketsQuantity": 3
   }
   ```

3. **Verify seats decremented:**
   ```sql
   SELECT event_seats_available FROM events WHERE event_id = 1;
   -- Should return: 7
   ```

4. **Check API response:**
   ```
   GET /customer/api/events/1/details
   
   Response should include:
   {
     "eventSeatsAvailable": 7,
     "eventTotalSeats": 10
   }
   ```

### Frontend Testing:

1. **Refresh events page**
   - Should show "7/10" for the test event

2. **Open event details**
   - Should show "Available Seats: 7/10"

3. **Book 2 more tickets**
   - After booking, refresh page
   - Should show "5/10"

4. **Book remaining 5 tickets**
   - Should show "0/10"
   - "Sold Out" message should appear
   - "Book Tickets" button should be disabled

---

## 🔧 Database Migration (If Needed)

If `eventSeatsAvailable` column doesn't exist:

```sql
-- Add the new column
ALTER TABLE events 
ADD COLUMN event_seats_available INT;

-- Initialize it to equal eventTotalSeats for existing events
UPDATE events 
SET event_seats_available = event_total_seats 
WHERE event_seats_available IS NULL;

-- For events that already have bookings, calculate correct available seats
UPDATE events e
SET event_seats_available = e.event_total_seats - COALESCE(
  (SELECT SUM(b.tickets_quantity) 
   FROM bookings b 
   WHERE b.event_id = e.event_id 
   AND b.booking_status != 'CANCELLED'),
  0
)
WHERE e.event_seats_available IS NULL;
```

---

## 📝 Summary

### Frontend Changes: ✅ DONE
- `EventsPage.js`: Now reads `eventSeatsAvailable` from API
- `EventDetails.js`: Now displays `eventSeatsAvailable` from API
- `EventCard.js`: Already supported dynamic seat updates

### Backend Changes: ⚠️ REQUIRED
1. Add `eventSeatsAvailable` column to database
2. Initialize field when creating events
3. Decrement field when creating bookings
4. Increment field when cancelling bookings
5. Include field in ALL event API responses

### Once Backend is Updated:
- Events page will show correct available seats (e.g., "453/500")
- Event details page will show real-time availability
- Sold-out events will display properly
- No more hardcoded "500/500" displays

---

## 🎯 Priority

**HIGH PRIORITY** - This affects user experience significantly. Users cannot see real availability, leading to:
- Failed booking attempts for sold-out events
- Confusion about seat availability
- Poor user experience

Please implement the backend changes ASAP! 🚀
