# JWT Token Expiry Implementation

## Overview
This document describes the automatic JWT token expiry handling system implemented in the EMS application. The system ensures that expired JWT tokens (valid for 1 day) are automatically detected and all localStorage data is cleared when expiry occurs.

## Features

### 1. **Automatic Token Validation**
- Tokens are validated automatically every minute
- Validation occurs on:
  - Application startup
  - Route changes
  - Before any authenticated API calls

### 2. **Automatic Data Cleanup**
When a token expires, the following data is automatically removed from localStorage:
- `token` - JWT authentication token
- `role` - User role (ADMIN, CUSTOMER, EVENT_ORGANIZER, etc.)
- `user` - User information object
- `organizerProfile` - Event organizer profile data
- `organizerId` - Event organizer ID
- `customerId` - Customer ID
- `customerProfile` - Customer profile data

### 3. **Automatic Redirection**
- When an expired token is detected, users are automatically redirected to the home page
- Users must re-login to access protected routes

## Implementation Details

### Files Modified

#### 1. `src/utils/jwt.js`
Enhanced with the following functions:

- **`isTokenExpired(token)`**
  - Checks if a JWT token has expired
  - Decodes the token and compares the `exp` claim with current time
  - Returns `true` if expired, `false` if valid

- **`clearAuthData()`**
  - Centralized function to clear all authentication data from localStorage
  - Used consistently across the application

- **`validateAndCleanupToken()`**
  - Validates the current token
  - Clears data if expired
  - Returns `true` if valid, `false` if expired

- **`setupTokenExpiryMonitor()`**
  - Sets up automatic monitoring with a 1-minute interval
  - Checks token validity every 60 seconds
  - Redirects to home page if token expired
  - Returns cleanup function for component unmounting

#### 2. `src/App.js`
- Imports `setupTokenExpiryMonitor` from jwt utilities
- Sets up monitoring in `useEffect` on app initialization
- Validates token on every route change in `AppContent` component

#### 3. `src/services/authService.js`
- Added `getAuthHeaders()` helper function
- Validates token before making authenticated API requests
- Throws error if token is expired
- Updated all authenticated API functions to use `getAuthHeaders()`

#### 4. `src/components/LoginForm.js`
- Imports and uses `clearAuthData()` for sign-out functionality
- Ensures consistent cleanup across the application

#### 5. `src/components/AdminDashboard/AdminEvents.js`
- Imports and uses `clearAuthData()` for admin sign-out
- Ensures consistent cleanup in admin panel

## How It Works

### Token Format
JWT tokens contain an `exp` (expiration) claim that specifies when the token expires (Unix timestamp in seconds).

### Validation Logic
```javascript
// Token is considered expired if:
1. Token doesn't exist
2. Token cannot be decoded
3. exp claim is missing
4. Current time >= exp time
```

### Monitoring Cycle
```
App Starts
    ↓
Immediate Token Check
    ↓
Setup 1-minute interval
    ↓
Every 60 seconds:
    - Validate token
    - If expired: Clear data + Redirect
    - If valid: Continue
```

### API Request Flow
```
User initiates API call
    ↓
getAuthHeaders() called
    ↓
validateAndCleanupToken() executed
    ↓
Token Valid? ──No──→ Throw Error + Clear Data
    ↓ Yes
Add Authorization header
    ↓
Make API request
```

## Usage Examples

### Checking Token Validity Manually
```javascript
import { validateAndCleanupToken } from './utils/jwt';

const isValid = validateAndCleanupToken();
if (!isValid) {
  // Token expired - user needs to login
  navigate('/login');
}
```

### Clearing Auth Data
```javascript
import { clearAuthData } from './utils/jwt';

// On logout or token expiry
clearAuthData();
```

### Checking Token Expiry
```javascript
import { isTokenExpired } from './utils/jwt';

const token = localStorage.getItem('token');
if (isTokenExpired(token)) {
  // Handle expired token
}
```

## Security Benefits

1. **Automatic Session Management**: No manual intervention needed
2. **Prevents Stale Sessions**: Expired tokens are immediately detected and cleared
3. **Consistent Behavior**: All components use the same cleanup logic
4. **Protected Routes**: Routes automatically check token validity
5. **API Security**: Authenticated requests validate tokens before sending

## Testing the Implementation

### Manual Testing
1. Login to the application
2. Manually modify the token's `exp` claim to a past timestamp
3. Wait up to 1 minute or navigate to a different route
4. Verify that localStorage is cleared and you're redirected to home

### Browser Console Testing
```javascript
// Check current token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decode and check expiry
const { decodeJWT, isTokenExpired } = require('./utils/jwt');
const decoded = decodeJWT(token);
console.log('Decoded:', decoded);
console.log('Is Expired:', isTokenExpired(token));
console.log('Expiry Date:', new Date(decoded.exp * 1000));
```

## Notes

- Token expiry is set on the backend (typically 24 hours / 1 day)
- The frontend checks every minute, providing a good balance between security and performance
- Users will never be able to use an expired token for API requests
- The system works even if the user keeps the app open for days

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiry
2. **Warning Notifications**: Show a warning 5-10 minutes before token expires
3. **Graceful Degradation**: Save user's current work before session expires
4. **Custom Expiry Handling**: Different expiry times for different user roles
