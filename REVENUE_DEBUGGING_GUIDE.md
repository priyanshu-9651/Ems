# Revenue Debugging Guide

## Issue: Total Revenue Showing 0 on Dashboard

### Current Implementation

The AdminDashboard uses the `/admin/Admin/allrevenue` API endpoint to fetch revenue data.

**File:** `src/components/AdminDashboard/AdminDashboard.js`

### Debugging Steps

#### 1. Check Console Logs

Open your browser's Developer Tools (F12) and look for these console logs:

```
=== REVENUE API DEBUG ===
Revenue API response: {...}
Revenue API success: true/false
Revenue API status: 200/400/500
Revenue API error: null/error message
Revenue data array length: X
Revenue data: [...]
Processing event: Event Name, revenue: Amount
Calculated total revenue: Amount
=== END REVENUE DEBUG ===
```

#### 2. Possible Causes and Solutions

##### **Cause 1: Backend Not Running**
- **Symptoms:** `Revenue API status: 0` or network error
- **Solution:** Start your Spring Boot backend server
  ```bash
  cd service
  mvn spring-boot:run
  # or
  java -jar target/your-app.jar
  ```

##### **Cause 2: No Events with Revenue**
- **Symptoms:** `Revenue data array length: 0` or `[]`
- **Solution:** 
  1. Create some events
  2. Make some bookings for those events
  3. Revenue is calculated as: `ticketPrice * numberOfBookings`

##### **Cause 3: Authentication Error**
- **Symptoms:** `Revenue API status: 401` or `403`
- **Solution:** 
  1. Check if JWT token is valid
  2. Log out and log back in as admin
  3. Check browser console for "Token expired" messages

##### **Cause 4: Wrong API Endpoint**
- **Symptoms:** `Revenue API status: 404`
- **Solution:** Verify backend is configured correctly
  - Check `application.properties`: `server.servlet.context-path=/admin`
  - Endpoint should be: `http://localhost:8080/admin/Admin/allrevenue`

##### **Cause 5: CORS Issues**
- **Symptoms:** CORS error in console
- **Solution:** Configure CORS in backend:
  ```java
  @CrossOrigin(origins = "http://localhost:3000")
  ```

#### 3. Test API Directly

Open a new browser tab and use the Network tab to check:

1. Go to Admin Dashboard
2. Open DevTools > Network tab
3. Filter for "allrevenue"
4. Check the request details:
   - **Status:** Should be 200
   - **Response:** Should be an array like:
     ```json
     [
       {
         "eventId": 201,
         "eventName": "Spring Conference",
         "eventTicketPrice": 150,
         "totalRevenue": 45000
       }
     ]
     ```

#### 4. Backend Verification

Check your backend logs for:
- SQL queries being executed
- Revenue calculation logic
- Any errors or exceptions

Expected SQL (approximate):
```sql
SELECT e.event_id, e.event_name, e.event_ticket_price, 
       COALESCE(SUM(b.total_amount), 0) as total_revenue
FROM events e
LEFT JOIN bookings b ON e.event_id = b.event_id
GROUP BY e.event_id, e.event_name, e.event_ticket_price
```

#### 5. Frontend State Check

Add this to `fetchDashboardData` to check state updates:
```javascript
setStats((prev) => {
  console.log('Previous stats:', prev);
  console.log('New totalRevenue:', totalRevenue);
  return {
    ...prev,
    totalRevenue: totalRevenue,
  };
});
```

### Expected Data Flow

1. **Component Mount** → `useEffect` triggers
2. **API Call** → `getAllEventRevenue()` calls backend
3. **Backend Response** → Returns array of EventRevenueDTO
4. **Data Processing** → Reduce to sum all `totalRevenue` values
5. **State Update** → `setStats()` updates `totalRevenue`
6. **UI Render** → Shows in green card

### Quick Fix Checklist

- [ ] Backend server is running on http://localhost:8080
- [ ] React app is running on http://localhost:3000
- [ ] Logged in as admin user
- [ ] JWT token is valid (not expired)
- [ ] At least one event exists in database
- [ ] At least one booking exists for an event
- [ ] Console shows no CORS errors
- [ ] Network tab shows successful API call (200 status)
- [ ] Response data contains revenue > 0

### Testing Revenue Calculation

If you see revenue data but total is still 0, check:

```javascript
// In console logs, look for:
Processing event: Event A, revenue: 1000
Processing event: Event B, revenue: 2000
Calculated total revenue: 3000  // Should be sum of all revenues
```

If individual revenues are 0, the problem is in the backend calculation.

### Common Mistakes

1. **Token Missing:** Revenue API requires admin authentication
2. **Empty Database:** Need events + bookings to have revenue
3. **Wrong Port:** Backend on 8080, frontend on 3000
4. **Context Path:** Don't forget `/admin` prefix in backend URL
5. **Data Type:** `totalRevenue` must be a number, not string

### Manual Test

Open browser console on Dashboard page and run:
```javascript
// Check current stats
console.log('Current stats:', window.location.href);

// Manually call API
fetch('http://localhost:8080/admin/Admin/allrevenue', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Manual API test:', data);
  const total = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  console.log('Manual total:', total);
})
.catch(err => console.error('Manual test error:', err));
```

### Contact Support

If revenue is still showing 0 after checking all above:

1. Share console logs (full output)
2. Share Network tab screenshot for `/allrevenue` request
3. Share backend logs
4. Confirm:
   - Number of events in database
   - Number of bookings in database
   - Sample revenue value from one event

---

## Current Code Implementation

### API Call (authService.js)
```javascript
export const getAllEventRevenue = async () => {
  try {
    const response = await fetch(`${API_HOST}/admin/Admin/allrevenue`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    return {
      success: response.ok,
      status: response.status,
      data,
      error: !response.ok ? data.error || data.message : null,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
};
```

### Dashboard Usage
```javascript
const revenueResponse = await getAllEventRevenue();
if (revenueResponse.success) {
  const revenueData = Array.isArray(revenueResponse.data) 
    ? revenueResponse.data 
    : [];
  const totalRevenue = revenueData.reduce(
    (sum, item) => sum + (item.totalRevenue || 0), 
    0
  );
  setStats(prev => ({ ...prev, totalRevenue }));
}
```

### Display
```jsx
<h3 className="mb-0">Rs. {stats.totalRevenue.toLocaleString()}</h3>
```

---

**Last Updated:** November 11, 2025
