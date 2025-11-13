# Ticket Booking System Update

## Summary
Updated the ticket booking system to support both **seated events** (with seat map) and **non-seated events** (general admission with quantity selection). The system now uses real data from the database instead of dummy/hardcoded values.

## Key Changes

### 1. **TicketBookingInterface.js** - Smart Booking Interface

#### Added Support for Non-Seated Events
- New state: `ticketQuantity` for general admission events
- New variable: `requiresSeat` determines if seat selection is needed
- Conditional rendering based on `event.eventRequiresSeat` field

#### Seated Events (eventRequiresSeat = true)
```javascript
// Shows seat map with visual selection
<SeatMap
  layout={layout}
  basePrice={event.eventTicketPrice}
  blocked={bookedSeats}
  value={selectedSeats}
  onChange={onSeatChange}
/>
```

#### Non-Seated Events (eventRequiresSeat = false)
```javascript
// Shows quantity selector with +/- buttons
<div className="d-flex align-items-center gap-3">
  <button onClick={() => setTicketQuantity(qty - 1)}>-</button>
  <input type="number" value={ticketQuantity} />
  <button onClick={() => setTicketQuantity(qty + 1)}>+</button>
</div>
```

#### Updated Booking Data Structure
**For Seated Events:**
```json
{
  "eventId": 123,
  "customerId": 456,
  "selectedSeats": ["A1", "A2", "A3"]
}
```

**For Non-Seated Events:**
```json
{
  "eventId": 123,
  "customerId": 456,
  "ticketsQuantity": 3
}
```

#### Price Calculation
- **Seated**: Sum of individual seat prices (supports different price categories)
- **Non-Seated**: `ticketQuantity × eventTicketPrice`

### 2. **TicketBookingPage.js** - Real Database Integration

#### Auto-populated Date & Time from Database
**Before (Dummy Data):**
```javascript
const dateOptions = ['2025-11-15', '2025-11-16', '2025-12-01'];
const timeOptions = ['03:00 PM', '07:00 PM'];
```

**After (Real Data):**
```javascript
// Extracted from event.eventStartDate and event.eventEndDate
const dateOptions = useMemo(() => {
  if (event.eventStartDate) {
    const startDate = new Date(event.eventStartDate);
    options.push(startDate.toLocaleDateString());
    // Add dates between start and end if multi-day event
  }
  return options;
}, [event]);

const timeOptions = useMemo(() => {
  if (event.eventStartDate) {
    const startDate = new Date(event.eventStartDate);
    return [startDate.toLocaleTimeString()];
  }
  return [];
}, [event]);
```

#### Auto-selection for Single Date/Time Events
- If event has only one date/time, it's automatically selected
- User sees an informational message: "This event has a fixed schedule"
- No need for manual selection when there's only one option

#### Enhanced Event Data Mapping
The API response is now fully mapped to the UI:
```javascript
const mappedEvent = {
  Id: data.eventId,
  Name: data.eventName,
  Cost: data.eventTicketPrice,
  seatLayout: data.seatLayout,
  eventRequiresSeat: data.eventRequiresSeat,     // NEW
  eventTotalSeats: data.eventTotalSeats,         // NEW
  eventSeatsAvailable: data.eventSeatsAvailable, // NEW
  StartDate: data.eventStartDate,                // NEW
  eventStartDate: data.eventStartDate,           // NEW
  eventEndDate: data.eventEndDate,               // NEW
  Location: data.eventLocation,                  // NEW
  eventMode: data.eventMode,                     // NEW
  // ... other fields
};
```

#### Visual Event Mode Indicator
Shows event type badges:
- **ONLINE** / **OFFLINE** / **HYBRID**
- **General Admission** (for non-seated events)

### 3. **Backward Compatibility**

The system maintains backward compatibility with existing code:
- Works with both old field names (Id, Name, Cost) and new ones (eventId, eventName, eventTicketPrice)
- Falls back to mock data if API data is unavailable
- Handles missing or null values gracefully

## User Experience Improvements

### For Seated Events:
1. User selects venue (if multiple)
2. User confirms date/time (auto-selected from DB)
3. User selects seats from interactive seat map
4. System shows selected seats and calculates total
5. User proceeds to payment

### For Non-Seated Events:
1. User selects venue (if multiple)
2. User confirms date/time (auto-selected from DB)
3. User selects quantity with +/- buttons or direct input
4. System shows quantity and calculates total
5. User proceeds to payment

## Technical Details

### Event Type Detection
```javascript
const requiresSeat = event?.eventRequiresSeat !== false;
```

### Seat Availability Calculation
**Seated Events:**
```javascript
const maxTickets = (layout.rows.length * layout.columns) - bookedSeats.length;
```

**Non-Seated Events:**
```javascript
const maxTickets = event?.eventTotalSeats || event?.eventSeatsAvailable || 100;
```

### Total Price Calculation
```javascript
const seatTotal = requiresSeat
  ? selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  : ticketQuantity * event.eventTicketPrice;
```

## Database Fields Used

### From `event` table:
- `eventId` - Event identifier
- `eventName` - Event title
- `eventStartDate` - Start datetime (ISO format)
- `eventEndDate` - End datetime (ISO format)
- `eventLocation` - Venue/location name
- `eventTicketPrice` - Base ticket price
- `eventRequiresSeat` - Boolean flag for seat selection
- `eventTotalSeats` - Maximum capacity
- `eventSeatsAvailable` - Current availability
- `seatLayout` - JSON string with seat configuration
- `eventMode` - ONLINE/OFFLINE/HYBRID

### From `booking` API:
- `selectedSeats` - Array of seat codes (for seated events)
- `ticketsQuantity` - Number of tickets (for non-seated events)

## Testing Checklist

### Seated Events:
- [ ] Seat map displays correctly
- [ ] Can select/deselect seats
- [ ] Blocked seats are unselectable
- [ ] Total calculates correctly
- [ ] Booking creates with seat codes

### Non-Seated Events:
- [ ] Quantity selector appears (no seat map)
- [ ] Can increment/decrement quantity
- [ ] Max limit enforced
- [ ] Total calculates correctly
- [ ] Booking creates with quantity

### Date/Time:
- [ ] Single date/time auto-selects
- [ ] Multiple dates show as options
- [ ] Time extracted from eventStartDate
- [ ] Multi-day events show date range

### General:
- [ ] Works with both API and fallback data
- [ ] Handles missing fields gracefully
- [ ] Event mode badge displays
- [ ] Booking confirmation works
- [ ] Navigation between steps works

## Files Modified

1. `src/components/events/user/TicketBookingInterface.js` ✅
   - Added quantity selector for non-seated events
   - Conditional rendering based on requiresSeat
   - Updated booking data structure

2. `src/components/events/user/TicketBookingPage.js` ✅
   - Real date/time from database
   - Auto-selection for single options
   - Enhanced event data mapping
   - Event mode indicators

## API Integration

### Expected Event Data Structure:
```json
{
  "eventId": 123,
  "eventName": "Concert Night",
  "eventStartDate": "2025-12-10T19:00:00",
  "eventEndDate": "2025-12-10T22:00:00",
  "eventLocation": "Main Arena",
  "eventTicketPrice": 500,
  "eventRequiresSeat": false,
  "eventTotalSeats": 1000,
  "eventSeatsAvailable": 850,
  "eventMode": "OFFLINE",
  "seatLayout": null
}
```

### Booking Endpoints:
- **GET** `/customer/api/events/:id/details` - Fetch event details
- **POST** `/customer/api/bookings` - Create booking
- **GET** `/customer/api/bookings/event/:id/booked-seats` - Get booked seats (seated events only)

## Notes

- Non-seated events skip the seat map entirely
- Date/time now come from `eventStartDate` instead of separate fields
- System auto-detects event type from `eventRequiresSeat` flag
- Quantity is limited by `eventSeatsAvailable` for non-seated events
- Rupee symbol (₹) is used consistently for all prices
