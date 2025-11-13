# Empty SeatLayout Handling Update

## Issue
The backend returns `seatLayout: ""` (empty string) for events that don't require seat selection, which was causing parsing errors and incorrect event type detection.

**Example API Response:**
```json
{
    "eventId": 3,
    "eventName": "Kolkata Zomaland",
    "eventTicketPrice": 500,
    "seatLayout": ""
}
```

## Solution

### 1. Smart Event Type Detection

The system now intelligently determines if an event requires seat selection by checking multiple conditions:

```javascript
const requiresSeat = useMemo(() => {
  // Check 1: Explicit flag
  if (event?.eventRequiresSeat === false) return false;
  
  // Check 2: Empty or null seatLayout
  if (!event?.seatLayout || event.seatLayout === '' || event.seatLayout === '""') return false;
  
  // Check 3: Valid JSON with rows/columns
  try {
    const parsed = JSON.parse(event.seatLayout);
    return parsed && (parsed.rows?.length > 0 || parsed.columns > 0);
  } catch (e) {
    return false;
  }
}, [event?.eventRequiresSeat, event?.seatLayout]);
```

### 2. Safe Seat Layout Parsing

The layout parsing now uses `useMemo` with proper error handling:

```javascript
const layout = useMemo(() => {
  // Return default if no seats required or layout is empty
  if (!requiresSeat || !event?.seatLayout || event.seatLayout === '' || event.seatLayout === '""') {
    return { rows: ['A','B','C','D','E','F'], columns: 10 };
  }
  
  // Try to parse JSON
  try {
    return JSON.parse(event.seatLayout);
  } catch (e) {
    console.error('Failed to parse seat layout:', e);
    return { rows: ['A','B','C','D','E','F'], columns: 10 };
  }
}, [requiresSeat, event?.seatLayout]);
```

### 3. Data Normalization in TicketBookingPage

Before setting event data, we normalize the `seatLayout` field:

```javascript
// Normalize seatLayout - convert empty string to null
const seatLayout = data.seatLayout && data.seatLayout !== '' && data.seatLayout !== '""' 
  ? data.seatLayout 
  : null;

// Determine if event requires seats
const eventRequiresSeat = data.eventRequiresSeat !== false && seatLayout !== null;

const mappedEvent = {
  seatLayout: seatLayout,
  eventRequiresSeat: eventRequiresSeat,
  // ... other fields
};
```

## How It Works

### For Events WITH Seat Selection
**API Response:**
```json
{
    "eventId": 1,
    "eventName": "Concert",
    "seatLayout": "{\"rows\":[\"A\",\"B\",\"C\"],\"columns\":10}"
}
```

**Result:**
- `requiresSeat` = `true`
- Shows seat map interface
- User selects specific seats
- Booking includes `selectedSeats: ["A1", "A2"]`

### For Events WITHOUT Seat Selection (General Admission)
**API Response:**
```json
{
    "eventId": 3,
    "eventName": "Kolkata Zomaland",
    "seatLayout": ""
}
```

**Result:**
- `requiresSeat` = `false`
- Shows quantity selector interface
- User selects number of tickets
- Booking includes `ticketsQuantity: 3`

## Edge Cases Handled

1. **Empty String**: `seatLayout: ""`
2. **Quoted Empty String**: `seatLayout: "\"\""`
3. **Null**: `seatLayout: null`
4. **Undefined**: `seatLayout: undefined`
5. **Invalid JSON**: `seatLayout: "{invalid json"`
6. **Valid JSON but no rows/columns**: `seatLayout: "{}"`

All these cases will result in `requiresSeat = false` and show the quantity selector.

## Benefits

✅ **No More Parsing Errors**: Safe JSON parsing with try-catch
✅ **Automatic Detection**: System automatically determines event type
✅ **Backward Compatible**: Works with both old and new data formats
✅ **Performance Optimized**: Uses `useMemo` to avoid re-parsing on every render
✅ **User-Friendly**: Shows appropriate interface based on event type

## Testing

### Test Case 1: Event with Empty SeatLayout
```javascript
// Input
{
  "eventId": 3,
  "eventName": "Kolkata Zomaland",
  "eventTicketPrice": 500,
  "seatLayout": ""
}

// Expected Behavior
- Shows: Quantity selector (not seat map)
- User can: Select 1, 2, 3, etc. tickets
- Total: quantity × 500
```

### Test Case 2: Event with Valid SeatLayout
```javascript
// Input
{
  "eventId": 1,
  "eventName": "Theater Show",
  "eventTicketPrice": 300,
  "seatLayout": "{\"rows\":[\"A\",\"B\"],\"columns\":5}"
}

// Expected Behavior
- Shows: Seat map with rows A, B (5 seats each)
- User can: Click to select seats A1, A2, etc.
- Total: sum of selected seat prices
```

### Test Case 3: Event with Explicit Flag
```javascript
// Input
{
  "eventId": 2,
  "eventName": "Workshop",
  "eventTicketPrice": 1000,
  "eventRequiresSeat": false,
  "seatLayout": null
}

// Expected Behavior
- Shows: Quantity selector
- User can: Select number of tickets
- Total: quantity × 1000
```

## Files Modified

1. **TicketBookingInterface.js**
   - Added `useMemo` import
   - Smart `requiresSeat` detection with multiple checks
   - Safe layout parsing with error handling

2. **TicketBookingPage.js**
   - Normalize `seatLayout` before mapping
   - Auto-determine `eventRequiresSeat` flag
   - Convert empty strings to null

## Console Warnings

If there are any issues, you'll see helpful console errors:
```
Failed to parse seat layout: SyntaxError: Unexpected token...
```

This helps with debugging without breaking the UI.

## Summary

The system is now robust and handles all variations of the `seatLayout` field:
- Empty strings are treated as "no seats required"
- Invalid JSON is caught and handled gracefully
- The UI automatically adapts to show the correct interface
- No code changes needed when backend sends empty strings

Your event "Kolkata Zomaland" with `seatLayout: ""` will now correctly show a quantity selector! 🎉
