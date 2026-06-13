# Gym Registration System - Troubleshooting Guide

## Common Issues & Solutions

---

## 🔴 Issue 1: Members Not Showing in Gym Owner Dashboard

### Symptoms
- Gym owner logs in and sees empty members list
- No members appear in the members tab

### Possible Causes & Solutions

#### ✓ Solution A: Verify Gym Owner Account is Active
```bash
# Check gym owner status
SELECT id, gym_name, status FROM gym_owners WHERE email = 'owner@gym.com';
```

**Expected**: `status` should be `'active'` or `'pending'`

**Fix**: If status is `'paused'` or `'disabled'`:
```bash
UPDATE gym_owners SET status = 'active' WHERE id = 'owner_id';
```

#### ✓ Solution B: Verify Users Are Created with Correct Gym Name
```bash
# Check if users exist with same gym name
SELECT user_id, name, gym_name FROM users 
WHERE gym_name = (SELECT gym_name FROM gym_owners WHERE id = 'owner_id');
```

**Expected**: Should show users created for this gym

**Issue**: If no users shown, users may have been created with different gym name (case variation)

**Fix**: Update user gym_name to match exactly:
```bash
UPDATE users 
SET gym_name = 'Official Gym Name'
WHERE gym_name ILIKE 'Official Gym Name';  -- Case-insensitive match
```

#### ✓ Solution C: Check Memberships Exist
```bash
# Verify memberships are created for users
SELECT m.user_id, m.plan_label, m.expiry_date 
FROM memberships m
JOIN users u ON m.user_id = u.id
WHERE u.gym_name = 'Your Gym Name';
```

**Issue**: If no memberships, users don't have active plans

**Fix**: Create test membership:
```bash
INSERT INTO memberships (user_id, gym_name, plan_id, plan_label, months, amount_paise, status, start_date, expiry_date)
VALUES ('user_id', 'Your Gym Name', 'test_plan', '3 Months', 3, 99900, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days');
```

#### ✓ Solution D: Verify API Call is Working
```javascript
// In browser console
const session = JSON.parse(localStorage.getItem('rs_gym_owner_session'));
const token = session?.accessToken;

fetch('http://localhost:4000/api/gym-owners/members', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```

**Expected**: Should return array of members (even if empty)

**Issue**: If 401/403 error, token is invalid

**Fix**: 
- Log out and log back in
- Check token in localStorage is valid
- Verify JWT secret in env matches

---

## 🔴 Issue 2: User Registration Fails with "Gym Not Found"

### Symptoms
- User enters correct gym name but gets error
- Error: "This gym is not registered with us"

### Possible Causes & Solutions

#### ✓ Solution A: Verify Gym is in registered_gyms Table
```bash
SELECT id, name, city FROM registered_gyms 
WHERE LOWER(name) = LOWER('gym_name_user_entered');
```

**Issue**: If no results, gym is not registered

**Fix**: Manually register gym:
```bash
INSERT INTO registered_gyms (name, city, gym_owner_id)
VALUES ('Exact Gym Name', 'City', 'gym_owner_id');
```

#### ✓ Solution B: Check for Case Sensitivity Issues
```bash
-- Find all gyms with similar names (case-insensitive)
SELECT id, name FROM registered_gyms 
WHERE LOWER(name) LIKE LOWER('%fitness%');
```

**Issue**: Gym might exist but with different capitalization

**Fix**: Standardize gym names:
```bash
UPDATE registered_gyms 
SET name = 'RS Fitness Mumbai'
WHERE LOWER(name) = LOWER('rs fitness mumbai');
```

#### ✓ Solution C: Verify Gym Owner Signup Completed
```bash
SELECT id, gym_name, status FROM gym_owners WHERE gym_name = 'Your Gym Name';
```

**Issue**: Gym owner may not have completed signup

**Fix**: Ensure gym owner signup was successful and gym was auto-registered

#### ✓ Solution D: Check Recent API Calls
```javascript
// Frontend - Check what gym names are being sent
fetch('http://localhost:4000/api/auth/check-gym?name=RS%20Fitness%20Mumbai')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: 
```json
{ "ok": true, "gymName": "RS Fitness Mumbai" }
```

**Issue**: If 404, gym not in database

---

## 🔴 Issue 3: Gym Owner Login Shows "Approval Pending"

### Symptoms
- Gym owner gets message: "Approval pending. You will get a call within 24 hours..."
- Can't access dashboard

### Possible Causes & Solutions

#### ✓ Solution A: Understand Pending Status (Expected Behavior)
- New gym owners are set to `status = 'pending'` for first 24 hours
- This is intentional for verification
- After 24 hours, automatically becomes `'active'`

#### ✓ Solution B: Override for Testing/Development
```bash
-- Make gym owner immediately active
UPDATE gym_owners 
SET status = 'active' 
WHERE email = 'owner@gym.com';
```

#### ✓ Solution C: Check Created Date
```bash
SELECT id, email, status, created_at, 
       AGE(now(), created_at) as hours_since_creation
FROM gym_owners 
WHERE email = 'owner@gym.com';
```

**Expected**: Should show created_at from 24 hours ago or more

**If less than 24 hours**: Wait or update status manually

#### ✓ Solution D: Check Admin Notification Sent
```bash
SELECT * FROM gym_owner_notifications 
WHERE gym_owner_id = 'owner_id'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: Should show notification with `status = 'sent'` or `'pending'`

---

## 🔴 Issue 4: Members Tab Shows Wrong Members

### Symptoms
- Gym owner sees members from wrong gym
- Members from other gyms appearing

### Possible Causes & Solutions

#### ✓ Solution A: Check JWT Token Contains Correct Gym Owner ID
```javascript
// Frontend - Decode token
const token = JSON.parse(localStorage.getItem('rs_gym_owner_session')).accessToken;
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded); // Check "sub" is correct gym_owner_id
```

#### ✓ Solution B: Verify Gym Name Matches
```bash
SELECT g.id, g.gym_name, r.name FROM gym_owners g
LEFT JOIN registered_gyms r ON g.id = r.gym_owner_id
WHERE g.id = 'gym_owner_id';
```

**Issue**: If gym_owners.gym_name doesn't match registered_gyms.name

**Fix**: Update to match:
```bash
UPDATE gym_owners 
SET gym_name = (SELECT name FROM registered_gyms WHERE gym_owner_id = 'owner_id')
WHERE id = 'owner_id';
```

#### ✓ Solution C: Check Users Have Correct Gym Name
```bash
SELECT u.id, u.name, u.gym_name FROM users u
WHERE u.gym_name != (SELECT gym_name FROM gym_owners WHERE id = 'owner_id');
```

**Expected**: Should be empty (no mismatches)

**Fix**: Update mismatched users:
```bash
UPDATE users 
SET gym_name = (SELECT gym_name FROM gym_owners WHERE id = 'owner_id')
WHERE id IN (SELECT user_id FROM memberships WHERE gym_name = '...');
```

---

## 🔴 Issue 5: Days Remaining Always Shows 0 or Negative

### Symptoms
- Member shows "-5 days" remaining
- Should show "30 days"

### Possible Causes & Solutions

#### ✓ Solution A: Check Membership Expiry Date
```bash
SELECT id, user_id, expiry_date, 
       CURRENT_DATE,
       (expiry_date - CURRENT_DATE) as days_remaining
FROM memberships
WHERE user_id = 'user_id'
ORDER BY expiry_date DESC
LIMIT 1;
```

**Issue**: If expiry_date is in past, shows negative

**Fix**: Update expiry date if membership should be active:
```bash
UPDATE memberships
SET expiry_date = CURRENT_DATE + INTERVAL '90 days'
WHERE user_id = 'user_id' AND status = 'active';
```

#### ✓ Solution B: Check Database Server Time
```bash
SELECT now(), CURRENT_DATE;
```

**Issue**: If DB server time is wrong, calculations are wrong

**Fix**: Sync server time or check timezone settings

---

## 🔴 Issue 6: Dropdown Doesn't Show Gyms During User Signup

### Symptoms
- User signup form shows empty gym dropdown
- No gyms appear in datalist

### Possible Causes & Solutions

#### ✓ Solution A: Check Gyms API is Working
```bash
curl http://localhost:4000/api/auth/gyms
```

**Expected**: 
```json
["RS Fitness Mumbai", "FitHub Delhi", ...]
```

**Issue**: If empty array or error, no gyms in database

**Fix**: Create gyms via gym owner signup

#### ✓ Solution B: Check Frontend is Fetching Gyms
```javascript
// In browser console
fetch('http://localhost:4000/api/auth/gyms')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Should show array of gym names

**Issue**: If error, check CORS or backend connection

#### ✓ Solution C: Verify Frontend Has getRegisteredGyms Function
```javascript
import { getRegisteredGyms } from "../../services/api";

getRegisteredGyms().then(console.log);
```

**Expected**: Should return array

#### ✓ Solution D: Check Browser Console for Errors
```javascript
// Frontend error checking
console.log('Session:', localStorage.getItem('rs_session'));
console.log('API URL:', import.meta.env.VITE_API_URL);
```

---

## 🔴 Issue 7: Send Member Reminder Not Working

### Symptoms
- Send reminder button clicked but nothing happens
- No WhatsApp message received

### Possible Causes & Solutions

#### ✓ Solution A: Check WhatsApp Service Configuration
```bash
# Check env variables
cat backend/.env | grep WHATSAPP
```

**Expected**: Should have WhatsApp API credentials

#### ✓ Solution B: Check Member Phone Number
```bash
SELECT id, name, phone FROM users WHERE id = 'user_id';
```

**Issue**: If phone is NULL or invalid format

**Fix**: Update phone number:
```bash
UPDATE users SET phone = '919876543210' WHERE id = 'user_id';
```

#### ✓ Solution C: Check WhatsApp Service Logs
```bash
# In backend, check if WhatsApp API call succeeds
grep -r "sendWhatsappMessage" backend/src/
```

#### ✓ Solution D: Test WhatsApp API Directly
```javascript
// In backend server.js or test script
import { sendWhatsappMessage } from "./services/whatsappService.js";

const success = await sendWhatsappMessage("Test message");
console.log('WhatsApp result:', success);
```

---

## 🔴 Issue 8: Migrations Not Running

### Symptoms
- `npm run migrate` shows no output
- Tables not created
- "Table does not exist" errors

### Possible Causes & Solutions

#### ✓ Solution A: Check Database Connection
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL
# or
cat backend/.env | grep DATABASE_URL
```

**Expected**: Should show valid PostgreSQL URL

**Fix**: Update .env file with correct credentials

#### ✓ Solution B: Run Migrations with Verbose Output
```bash
cd backend
node -e "
import('./src/db/migrate.js').then(() => {
  console.log('Migrations completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
"
```

#### ✓ Solution C: Check Migrations Have Run
```bash
SELECT * FROM schema_migrations ORDER BY applied_at;
```

**Expected**: Should show migration files (001 through 005)

**Missing migrations**: Run `npm run migrate` again

#### ✓ Solution D: Check Table Exists
```bash
SELECT * FROM registered_gyms LIMIT 1;
```

**If error**: Run migrations again with error checking:
```bash
npm run migrate 2>&1
```

---

## 🔴 Issue 9: Register Gym Button Not Working

### Symptoms
- Gym owner signup form not submitting
- "Create Gym Owner Account" button doesn't respond

### Possible Causes & Solutions

#### ✓ Solution A: Check Form Validation
```javascript
// In frontend, check validation
if (!gymForm.gymName.trim() || !gymForm.phone.trim() || 
    !gymForm.email.trim() || !gymForm.password || !gymForm.city.trim()) {
  console.log('Form incomplete');
}
```

**Fix**: Ensure all fields are filled

#### ✓ Solution B: Check Backend Endpoint
```bash
curl -X POST http://localhost:4000/api/gym-owners/signup \
  -H "Content-Type: application/json" \
  -d '{
    "gymName": "Test",
    "phone": "9999999999",
    "email": "test@test.com",
    "password": "password123",
    "city": "Test"
  }'
```

**Issue**: If connection refused, backend not running

**Fix**: Start backend:
```bash
cd backend
npm run dev
```

#### ✓ Solution C: Check for Duplicate Gym
```bash
SELECT * FROM registered_gyms WHERE LOWER(name) = LOWER('test gym');
```

**Issue**: If gym already exists, error 409 "Gym already registered"

**Fix**: Use different gym name

#### ✓ Solution D: Check Email/Phone Uniqueness
```bash
SELECT * FROM gym_owners WHERE email = 'test@test.com' OR phone = '9999999999';
```

**Issue**: If records exist, error 409 "Already exists"

**Fix**: Use different email/phone or delete existing record

---

## 🟡 Issue 10: Slow Member Queries

### Symptoms
- Members list takes long time to load
- Dashboard is sluggish with many members

### Possible Causes & Solutions

#### ✓ Solution A: Check Indexes Exist
```bash
SELECT * FROM pg_indexes 
WHERE tablename IN ('users', 'memberships', 'gym_owners')
ORDER BY tablename;
```

**Expected**: Should have indexes on gym_name, user_id, etc.

**Fix**: Create indexes manually if missing:
```bash
CREATE INDEX IF NOT EXISTS idx_users_gym_name ON users(gym_name);
CREATE INDEX IF NOT EXISTS idx_memberships_gym_name ON memberships(gym_name);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
```

#### ✓ Solution B: Run Query Explain Plan
```bash
EXPLAIN ANALYZE
SELECT u.id, u.name, m.plan_label
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id
WHERE u.gym_name = 'Your Gym';
```

**Expected**: Should use indexes (Seq Scan should be fast)

#### ✓ Solution C: Check Row Count
```bash
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM memberships;
```

**If huge numbers**: Consider pagination on frontend

#### ✓ Solution D: Add Pagination to API
```javascript
// API endpoint with limit/offset
GET /gym-owners/members?limit=50&offset=0
```

---

## ✅ Verification Checklist

Run this to verify everything is working:

```bash
cd backend
npm install
npm run migrate

# Run automated verification
node verify-gym-registration.js
```

Expected output:
- ✓ Health check
- ✓ Get registered gyms
- ✓ Register gym owner
- ✓ Verify gym is registered
- ✓ Register user with valid gym
- ✓ Reject user with invalid gym

---

## 📞 Getting Help

1. **Check these files first:**
   - QUICK_REFERENCE.md - Quick overview
   - IMPLEMENTATION_GUIDE.md - Detailed implementation
   - FEATURE_GYM_REGISTRATION.md - Feature documentation

2. **Run verification:**
   ```bash
   cd backend
   node verify-gym-registration.js
   ```

3. **Check logs:**
   ```bash
   # Frontend
   Open browser DevTools (F12) → Console tab
   
   # Backend
   npm run dev  # Will show errors
   ```

4. **Check database:**
   ```bash
   psql <your_database_url>
   SELECT * FROM registered_gyms;
   SELECT * FROM gym_owners;
   ```

---

## 🆘 Still Having Issues?

1. ✅ Run `npm run migrate` again
2. ✅ Check environment variables in `.env`
3. ✅ Verify database connection
4. ✅ Check browser console for errors
5. ✅ Check backend server logs
6. ✅ Run `verify-gym-registration.js`

**All else fails**: Clear data and start fresh:
```bash
psql <your_database>
DROP TABLE IF EXISTS registered_gyms;
DROP TABLE IF EXISTS gym_owners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
npm run migrate
```

Then re-run tests.
