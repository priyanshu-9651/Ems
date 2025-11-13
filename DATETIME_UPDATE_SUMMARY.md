# DateTime Backend Integration Update

## Summary
Updated the event creation/editing forms to properly handle datetime fields as required by the backend API, which expects `StartDate` and `EndDate` in ISO datetime format (e.g., `"2025-12-10T19:00:00"`).

## Changes Made

### 1. OrganizerCreateEvent.js
**Location:** `src/components/EventOrganizerDashboard/OrganizerCreateEvent.js`

#### Added Time Fields to State:
```javascript
const [eventData, setEventData] = useState({
  // ... existing fields
  eventStartDate: '',
  eventStartTime: '09:00',  // NEW: Default start time
  eventEndDate: '',
  eventEndTime: '17:00',    // NEW: Default end time
  // ... rest of fields
});
```

#### Updated Form UI:
- Added **Start Time** input field (type="time") after Start Date
- Added **End Time** input field (type="time") after End Date
- Both time fields use 24-hour format (HH:mm)

#### Updated Data Submission:
Before sending to backend, the code now:
1. Combines date and time fields into ISO datetime format
2. Removes the separate time fields from the payload

```javascript
const preparedEventData = {
  ...eventData,
  eventStartDate: eventData.eventStartDate && eventData.eventStartTime 
    ? `${eventData.eventStartDate}T${eventData.eventStartTime}:00`
    : eventData.eventStartDate,
  eventEndDate: eventData.eventEndDate && eventData.eventEndTime
    ? `${eventData.eventEndDate}T${eventData.eventEndTime}:00`
    : eventData.eventEndDate || null,
};

// Remove time fields before sending to backend
delete preparedEventData.eventStartTime;
delete preparedEventData.eventEndTime;
```

#### Updated Edit Mode:
When editing an existing event, the datetime string is split into date and time components:
```javascript
const extractDateTime = (datetime) => {
  if (!datetime) return { date: '', time: '09:00' };
  const dt = new Date(datetime);
  const date = dt.toISOString().split('T')[0];
  const time = dt.toTimeString().slice(0, 5);
  return { date, time };
};
```

### 2. AdminCreateEvent.js
**Location:** `src/components/AdminDashboard/AdminCreateEvent.js`

Applied identical changes as OrganizerCreateEvent.js:
- Added `eventStartTime` and `eventEndTime` to state
- Added time input fields to the form
- Updated submission logic to combine date and time into ISO datetime format

## Backend API Compatibility

### Expected Format:
```json
{
  "eventName": "My Concert",
  "eventDescr": "A great concert.",
  "eventStartDate": "2025-12-10T19:00:00",
  "eventEndDate": "2025-12-10T22:30:00",
  "eventLocation": "Main Hall",
  "eventCategory": "Music"
}
```

### Previous Format (Incorrect):
```json
{
  "eventStartDate": "2025-12-10",
  "eventEndDate": "2025-12-10"
}
```

## User Experience Improvements

1. **Separate Time Controls**: Users can now easily set event start and end times without manually typing datetime strings
2. **Default Times**: Sensible defaults (9:00 AM start, 5:00 PM end) pre-populate the time fields
3. **Better UX**: Using native HTML5 time pickers provides a consistent, accessible interface
4. **Validation**: Start time is marked as required along with start date

## Testing Checklist

- [ ] Create a new event with both date and time
- [ ] Create an event with only start date/time (end date optional)
- [ ] Edit an existing event and verify times are correctly loaded
- [ ] Verify backend receives datetime in ISO format: `YYYY-MM-DDTHH:mm:ss`
- [ ] Test on both Organizer and Admin dashboards

## Related Files

- `src/components/EventOrganizerDashboard/OrganizerCreateEvent.js` - Updated ✅
- `src/components/AdminDashboard/AdminCreateEvent.js` - Updated ✅
- `src/services/eventService.js` - No changes needed (already handles the API calls correctly)
- Backend API: `/organizer/events/create/:organizerId` - Expects datetime format

## Notes

- Time fields use 24-hour format (HH:mm) as standard in HTML5 time inputs
- Times are stored with `:00` seconds appended (e.g., `19:00:00`)
- End date/time remains optional (can be null)
- The changes maintain backward compatibility with existing events
