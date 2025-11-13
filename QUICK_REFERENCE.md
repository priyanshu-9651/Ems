# Quick Reference Guide - Authentication & Profile Management

## 🚀 What's New

### ✅ JWT Token Auto-Expiry (1 Day Validity)
- Tokens automatically validated every 60 seconds
- All localStorage data cleared when token expires
- Users redirected to home on expiry

### ✅ Organizer Profile Auto-Setup
- Organizer profiles fetched or created automatically on login
- `organizerId` stored in localStorage
- All event API calls work immediately

---

## 📦 localStorage Data After Login

### Customer
```javascript
token: "eyJhbGc..."
role: "CUSTOMER"
user: {...}
customerId: "123"
customerProfile: {...}
```

### Event Organizer
```javascript
token: "eyJhbGc..."
role: "EVENT_ORGANIZER"
user: {...}
organizerId: "456"           // ← Auto-fetched/created
organizerProfile: {...}      // ← Auto-fetched/created
```

### Admin
```javascript
token: "eyJhbGc..."
role: "ADMIN"
user: {...}
```

---

## 🔐 Token Validation Points

1. **App Start** - Validates immediately
2. **Every 60 Seconds** - Background monitoring
3. **Route Changes** - Before rendering protected routes
4. **API Calls** - Before every authenticated request

---

## 🎯 Key Functions (src/utils/jwt.js)

```javascript
// Check if token expired
isTokenExpired(token)

// Clear all auth data
clearAuthData()

// Validate and cleanup if expired
validateAndCleanupToken()

// Setup auto-monitoring
setupTokenExpiryMonitor()
```

---

## 🔄 Login Flow

### For Event Organizers (NEW!)
```
1. Login successful
2. Store token, role, user
3. Extract userId from response
4. Try to fetch organizer profile
   ├─ Exists? → Store organizerId + profile ✅
   └─ Not exists? → Create new profile → Store organizerId + profile ✅
5. Redirect to /organizer
```

### For Customers
```
1. Login successful
2. Store token, role, user
3. Fetch customer profile
4. Store customerId + profile
5. Redirect to /userprofile
```

---

## 📝 API Endpoints Used

### Profile Management
```
GET  /organizer/organizerProfile/{userId}  - Fetch organizer profile
POST /organizer/organizerProfile           - Create organizer profile
GET  /customer/api/customers/user/{userId} - Fetch customer profile
POST /customer/api/customers               - Create customer profile
```

### Events (Require organizerId)
```
POST /organizer/events/create/{organizerId}
GET  /organizer/events/organizer/{organizerId}
GET  /organizer/events/organizer/{organizerId}/count
GET  /organizer/events/organizer/{organizerId}/ongoing
```

---

## 🧪 Testing in Browser Console

### Check Auth State
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('Role:', localStorage.getItem('role'));
console.log('Organizer ID:', localStorage.getItem('organizerId'));
console.log('Customer ID:', localStorage.getItem('customerId'));
```

### Check Token Expiry
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
console.log('Is Expired:', payload.exp < Date.now() / 1000);
```

### Manually Clear Auth Data
```javascript
localStorage.clear();
// or use the centralized function (if available in console)
// clearAuthData()
```

---

## 🐛 Common Issues & Fixes

### Issue: "Organizer ID not found"
**Fix:** Re-login to trigger automatic profile fetch/creation

### Issue: Token expires too quickly
**Fix:** Check backend JWT expiry is set to 1 day (86400 seconds)

### Issue: Profile not created in DB
**Fix:** 
- Check backend `/organizer/organizerProfile` endpoint is working
- Verify network requests in browser DevTools
- Check backend logs for errors

### Issue: API calls fail after login
**Fix:**
- Verify `organizerId` exists in localStorage
- Check if token is valid
- Re-login if needed

---

## 📚 Documentation Files

1. **JWT_TOKEN_EXPIRY_IMPLEMENTATION.md** - Token expiry details
2. **ORGANIZER_PROFILE_AUTO_SETUP.md** - Profile setup details
3. **AUTHENTICATION_SUMMARY.md** - Complete implementation guide
4. **QUICK_REFERENCE.md** - This file

---

## ✨ Benefits

### Users
- ✅ No manual profile creation
- ✅ Immediate access to all features
- ✅ Automatic session security
- ✅ Seamless experience

### Developers
- ✅ Centralized auth management
- ✅ Consistent code patterns
- ✅ Easy to maintain
- ✅ Well documented

### Security
- ✅ 1-day token validity enforced
- ✅ Automatic session cleanup
- ✅ No stale data
- ✅ Role-based isolation

---

## 🎨 Files Modified

### Core Files
- `src/utils/jwt.js` - JWT utilities (NEW)
- `src/App.js` - Token monitoring
- `src/services/authService.js` - API token validation
- `src/components/LoginForm.js` - Auto profile management

### Dashboard Files
- `src/components/AdminDashboard/AdminEvents.js`
- `src/components/EventOrganizerDashboard/OrganizerDashboard.js`

---

## 🚦 Ready to Use!

All features are **production-ready** with:
- ✅ No syntax errors
- ✅ Comprehensive error handling
- ✅ Complete documentation
- ✅ Tested implementation

Happy coding! 🎉
