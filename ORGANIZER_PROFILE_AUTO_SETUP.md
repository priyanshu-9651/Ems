# Organizer Profile Auto-Setup Implementation

## Overview
This document describes the automatic organizer profile fetching and creation system implemented in the EMS application. When an event organizer logs in, the system automatically fetches their existing profile or creates a new one if it doesn't exist, ensuring all organizer-related API calls have the required `organizerId`.

## Problem Statement
Previously, when event organizers logged in:
- The organizer profile was not automatically fetched from the database
- The `organizerId` was not stored in localStorage
- API calls requiring `organizerId` would fail
- Organizers had to manually create their profile

## Solution
Implemented automatic profile management that:
1. **Fetches existing organizer profile** on login if one exists
2. **Creates a new organizer profile** automatically if none exists
3. **Stores organizerId** in localStorage for API calls
4. **Stores complete organizer profile** for quick access

## Implementation Details

### Files Modified

#### 1. `src/components/LoginForm.js`

**Added Imports:**
```javascript
import { getOrganizerProfile, createOrganizerProfile } from '../services/authService';
import { clearAuthData } from '../utils/jwt';
```

**Enhanced Login Logic:**
After successful login for EVENT_ORGANIZER, EVENT_MANAGER, or ORGANIZER roles:

```javascript
// 1. Extract userId from login response
const userId = userData.id || userData.userId || userData.UserID;

// 2. Try to fetch existing organizer profile
const organizerResp = await getOrganizerProfile(userId);

if (organizerResp.success && organizerResp.data) {
  // Profile exists - store it
  localStorage.setItem('organizerId', organizerData.organizerId);
  localStorage.setItem('organizerProfile', JSON.stringify(organizerData));
} else {
  // Profile doesn't exist - create new one
  const newOrganizerProfile = {
    userId: userId,
    organizationName: userData.fullName || 'Organization',
    contactEmail: userData.email || '',
    contactPhone: userData.phone || '',
    // ... other fields with defaults
  };
  
  const createResp = await createOrganizerProfile(newOrganizerProfile);
  // Store the newly created profile
  localStorage.setItem('organizerId', newOrganizerData.organizerId);
  localStorage.setItem('organizerProfile', JSON.stringify(newOrganizerData));
}
```

#### 2. `src/components/EventOrganizerDashboard/OrganizerDashboard.js`

**Updated Sign-Out:**
- Now uses centralized `clearAuthData()` function
- Ensures all localStorage data is properly cleared

```javascript
import { clearAuthData } from "../../utils/jwt";

// In sign-out handler
clearAuthData();
window.location.href = "/";
```

#### 3. `src/services/authService.js`

**Existing Functions Used:**
- `getOrganizerProfile(userId)` - Fetches organizer profile by userId
- `createOrganizerProfile(profileData)` - Creates new organizer profile

These functions communicate with the backend API at:
- `GET /organizer/organizerProfile/{userId}`
- `POST /organizer/organizerProfile`

## How It Works

### Login Flow for Event Organizers

```
User Logs In
    ↓
Verify Credentials (Backend)
    ↓
Receive JWT Token + User Data
    ↓
Store Token, Role, User in localStorage
    ↓
Check if role is EVENT_ORGANIZER/EVENT_MANAGER/ORGANIZER
    ↓
    Yes → Fetch Organizer Profile
    ↓
Profile Exists?
    ↓
Yes → Store organizerId + profile
    ↓
No → Create New Profile
    ↓
Store organizerId + profile
    ↓
Redirect to /organizer Dashboard
```

### localStorage Data Stored

For event organizers, the following data is stored:

```javascript
{
  "token": "eyJhbGc...",           // JWT token
  "role": "EVENT_ORGANIZER",       // User role
  "user": {...},                   // User object from login
  "organizerId": "123",            // Organizer ID (critical for API calls)
  "organizerProfile": {            // Complete organizer profile
    "organizerId": "123",
    "userId": "456",
    "organizationName": "My Events Co",
    "contactEmail": "organizer@example.com",
    "contactPhone": "+1234567890",
    "description": "",
    "website": "",
    "address": "",
    "city": "",
    "state": "",
    "postalCode": "",
    "country": ""
  }
}
```

### Default Profile Creation

When creating a new organizer profile, the system uses:

| Field | Source | Default |
|-------|--------|---------|
| `userId` | From login response | Required |
| `organizationName` | `userData.fullName` | "Organization" |
| `contactEmail` | `userData.email` | "" |
| `contactPhone` | `userData.phone` | "" |
| `description` | - | "" |
| `website` | - | "" |
| `address` | - | "" |
| `city` | - | "" |
| `state` | - | "" |
| `postalCode` | - | "" |
| `country` | - | "" |

## API Integration

### Event Service Dependencies

The event service (`src/services/eventService.js`) relies on `organizerId` from localStorage:

```javascript
// Example: Create Event
export const createEvent = async (eventData) => {
  const organizerId = localStorage.getItem('organizerId');
  if (!organizerId) {
    return {
      success: false,
      error: 'Organizer ID not found. Please log in again.',
    };
  }
  // Use organizerId in API call
  return makeEventRequest(`/organizer/events/create/${organizerId}`, {...});
};
```

### Functions That Require organizerId

1. `createEvent()` - Create new event
2. `getEventsForOrganizer()` - Get all events for this organizer
3. `getEventCountForOrganizer()` - Get total event count
4. `getOngoingEventsForOrganizer()` - Get ongoing events

All these functions now work automatically after login!

## Error Handling

### Profile Fetch Fails
If fetching the organizer profile fails (network error, server error):
- Error is logged to console
- Login continues successfully
- User can still access organizer dashboard
- Profile can be created/fetched later

### Profile Creation Fails
If creating a new profile fails:
- Error is logged to console
- Login continues successfully
- User can manually create profile in settings
- System will retry on next login

## Testing

### Test Case 1: Existing Organizer Login
1. Login with organizer credentials who already has a profile
2. Check localStorage for `organizerId` and `organizerProfile`
3. Navigate to organizer dashboard
4. Verify API calls work (create event, view events, etc.)

### Test Case 2: New Organizer Login
1. Login with new organizer credentials (no profile in DB)
2. System should auto-create profile
3. Check localStorage for `organizerId` and `organizerProfile`
4. Navigate to organizer dashboard
5. Verify API calls work

### Test Case 3: Profile Verification
```javascript
// In browser console after organizer login
const organizerId = localStorage.getItem('organizerId');
const organizerProfile = JSON.parse(localStorage.getItem('organizerProfile'));

console.log('Organizer ID:', organizerId);
console.log('Organizer Profile:', organizerProfile);
```

## Benefits

### 1. **Seamless User Experience**
- Organizers don't need to manually create profiles
- Immediate access to all features after login

### 2. **Automatic Database Synchronization**
- Profile is created in database on first login
- All subsequent logins fetch existing profile
- No duplicate profiles

### 3. **API Call Success**
- All event-related API calls have required `organizerId`
- No "Organizer ID not found" errors
- Dashboard loads data correctly

### 4. **Consistent Data Management**
- Uses centralized `clearAuthData()` for logout
- All organizer data properly managed
- Token expiry clears all data automatically

## Database Schema Integration

The system works with the following database endpoints:

### Backend API Endpoints Required

1. **GET** `/organizer/organizerProfile/{userId}`
   - Returns organizer profile for given userId
   - Returns 404 if profile doesn't exist

2. **POST** `/organizer/organizerProfile`
   - Creates new organizer profile
   - Accepts profile data in request body
   - Returns created profile with `organizerId`

### Expected Response Format

**Get Profile Success:**
```json
{
  "organizerId": 123,
  "userId": 456,
  "organizationName": "My Events Co",
  "contactEmail": "organizer@example.com",
  "contactPhone": "+1234567890",
  "description": "Event planning company",
  "website": "https://myevents.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA"
}
```

**Create Profile Success:**
```json
{
  "organizerId": 789,
  "userId": 456,
  "organizationName": "John Doe",
  // ... other fields
}
```

## Future Enhancements

1. **Profile Completeness Check**
   - Prompt users to complete their profile if fields are empty
   - Show progress indicator for profile completion

2. **Profile Validation**
   - Validate email and phone formats
   - Require certain fields before allowing event creation

3. **Profile Update on Login**
   - Sync profile changes from backend on each login
   - Handle profile updates made from other devices

4. **Offline Support**
   - Cache profile data
   - Work offline with cached data
   - Sync when connection restored

## Troubleshooting

### Issue: organizerId is null
**Solution:** 
- Check if user role is exactly "EVENT_ORGANIZER", "EVENT_MANAGER", or "ORGANIZER"
- Verify backend returns user ID in login response
- Check browser console for profile fetch/create errors

### Issue: Profile not created in database
**Solution:**
- Verify backend API endpoint is working
- Check network tab for failed requests
- Ensure backend accepts profile data format
- Check backend logs for errors

### Issue: API calls fail with "Organizer ID not found"
**Solution:**
- Verify `organizerId` exists in localStorage
- Re-login to trigger profile fetch/create
- Clear localStorage and login again
- Check if token has expired

## Summary

The automatic organizer profile setup ensures:
✅ Organizers can use the system immediately after login
✅ No manual profile creation required
✅ All API calls have the required `organizerId`
✅ Consistent data management across the application
✅ Seamless integration with backend database
✅ Proper cleanup on logout and token expiry
