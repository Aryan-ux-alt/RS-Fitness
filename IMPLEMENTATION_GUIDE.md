# Gym Registration & Owner Members Management - Complete Implementation Guide

## 🎯 Feature Overview

This system implements a complete gym registration and member management workflow:

1. **Gym Owner Registration** → Gym auto-registered in `registered_gyms` database
2. **User Registration** → Users select from registered gyms, system validates gym exists
3. **Members Tab** → Gym owners see all members from their gym when logged in

---

## 📊 Database Schema

### Tables Created (via migrations)

```
registered_gyms
├── id (UUID primary key)
├── name (text, unique)
├── city (text)
├── gym_owner_id (UUID, foreign key → gym_owners.id)
└── created_at (timestamp)

gym_owners (migration 002)
├── id, gym_name, phone, email, password_hash
├── city, status, last_login_at, created_at

users (migration 001) 
├── id, name, email, phone, password_hash, gym_name
├── role, created_at, deleted_at

memberships (migration 001)
├── user_id, gym_name, plan_label, start_date
├── expiry_date, status, amount_paise
```

---

## 🔄 Complete User Flows

### Flow 1: Gym Owner Registration

```
POST /gym-owners/signup
{
  "gymName": "RS Fitness Mumbai",
  "phone": "9876543210",
  "email": "owner@gym.com",
  "password": "secure123",
  "city": "Mumbai"
}
↓
✅ Creates gym_owners record
✅ Auto-inserts into registered_gyms table
✅ Returns pending approval status
✅ Sends WhatsApp notification
```

**Code Location**: [backend/src/controllers/gymOwnerController.js](backend/src/controllers/gymOwnerController.js#L50-L87)

### Flow 2: User Registration (Member)

```
POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "secure123",
  "gymName": "RS Fitness Mumbai"
}
↓
✅ Validates gymName exists in registered_gyms
✅ Uses official gym name from database
✅ Creates user with gym_name field
✅ Sets default goal (bulking)
```

**Code Location**: [backend/src/controllers/authController.js](backend/src/controllers/authController.js#L28-L46)

### Flow 3: Gym Owner Views Members

```
GET /gym-owners/members
Headers: Authorization: Bearer <gym_owner_token>
↓
✅ Gets gym_owner's gym_name
✅ Fetches all users with that gym_name
✅ Joins with latest membership data
✅ Calculates days_remaining
✅ Sorts by expiry_date (soon expiring first)
```

**Response Example:**
```json
[
  {
    "user_id": "uuid-123",
    "name": "John Doe",
    "phone": "9876543210",
    "plan": "3 Months",
    "start_date": "2024-01-01",
    "expiry_date": "2024-04-01",
    "status": "active",
    "days_remaining": "25"
  }
]
```

**Code Location**: [backend/src/controllers/gymOwnerController.js](backend/src/controllers/gymOwnerController.js#L93-L119)

---

## 🛣️ API Endpoints

### Authentication Routes

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/auth/signup` | User registration | ❌ |
| POST | `/auth/login` | User login | ❌ |
| POST | `/auth/logout` | User logout | ✅ |
| POST | `/auth/refresh` | Refresh access token | ❌ |
| GET | `/auth/check-gym` | Check if gym is registered | ❌ |
| GET | `/auth/gyms` | List all registered gyms | ❌ |

### Gym Owner Routes

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/gym-owners/signup` | Register gym owner | ❌ |
| POST | `/gym-owners/login` | Gym owner login | ❌ |
| POST | `/gym-owners/logout` | Gym owner logout | ✅ |
| POST | `/gym-owners/refresh` | Refresh token | ❌ |
| **GET** | **`/gym-owners/members`** | **Get gym members** | **✅** |
| GET | `/gym-owners/revenue` | Revenue stats | ✅ |
| POST | `/gym-owners/send-reminder` | Send reminder to member | ✅ |
| GET | `/gym-owners/payments` | Monthly payments | ✅ |

---

## 🎨 Frontend Implementation

### User Signup Flow

**File**: [frontend/src/components/auth/AuthScreen.jsx](frontend/src/components/auth/AuthScreen.jsx)

```jsx
// 1. Fetch registered gyms when user switches to signup
useEffect(() => {
  if (mode === "signup") {
    getRegisteredGyms()
      .then(gyms => setRegisteredGyms(gyms))
  }
}, [mode]);

// 2. Display gym list as datalist
<AuthInput 
  label="Gym Name" 
  value={form.gymName} 
  list="gyms-list"
/>
<datalist id="gyms-list">
  {registeredGyms.map(gym => (
    <option key={gym} value={gym} />
  ))}
</datalist>

// 3. Validate gym exists before signup
const checkRes = await checkGym(form.gymName);
const exactGymName = checkRes.gymName; // Use official name
```

### Gym Owner Dashboard

**File**: [frontend/src/components/gym-owner/GymOwnerDashboard.jsx](frontend/src/components/gym-owner/GymOwnerDashboard.jsx)

```jsx
// 1. Load members on component mount
useEffect(() => {
  const membersData = await getGymMembers();
  setMembers(membersData);
}, []);

// 2. Calculate statistics
const totalMembers = members.length;
const activeMembers = members.filter(m => m.status === "active").length;
const expiredMembers = members.filter(m => m.status === "expired").length;

// 3. Filter members by search
const filteredMembers = members.filter(m => 
  m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  m.plan?.toLowerCase().includes(searchQuery.toLowerCase())
);

// 4. Display with expiry alerts
{members.map(member => (
  <tr key={member.user_id}>
    <td>{member.name}</td>
    <td>{member.plan}</td>
    <td>{member.days_remaining} days</td>
    <td>{member.status}</td>
  </tr>
))}
```

---

## 🔐 Authentication Flow

### Access Control

```javascript
// Gym Owner Auth Check (auth.js middleware)
if (req.user.role !== "gym_owner") {
  return res.status(403).json({ message: "Gym owner role required" });
}

// JWT Token includes:
{
  sub: gymOwner.id,
  email: gymOwner.email,
  role: "gym_owner"
}
```

---

## 🧪 Testing the Implementation

### 1. Test Gym Owner Registration

```bash
curl -X POST http://localhost:4000/api/gym-owners/signup \
  -H "Content-Type: application/json" \
  -d '{
    "gymName": "Test Gym",
    "phone": "9999999999",
    "email": "test@gym.com",
    "password": "password123",
    "city": "Delhi"
  }'
```

**Expected**: 
- ✅ Gym owner created with status "pending"
- ✅ Gym auto-registered in `registered_gyms`
- ✅ WhatsApp notification sent to admin

### 2. Test User Registration

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "8888888888",
    "password": "password123",
    "gymName": "Test Gym"
  }'
```

**Expected**:
- ✅ Validates "Test Gym" exists
- ✅ User created with gym_name set
- ✅ Returns OTP for verification

### 3. Test Get Members

```bash
curl -X GET http://localhost:4000/api/gym-owners/members \
  -H "Authorization: Bearer <gym_owner_access_token>"
```

**Expected**:
- ✅ Returns array of users with that gym
- ✅ Includes membership details and days remaining
- ✅ Sorted by expiry_date DESC

### 4. Test Get Registered Gyms

```bash
curl -X GET http://localhost:4000/api/auth/gyms
```

**Expected**:
- ✅ Returns array of gym names
- ✅ Sorted alphabetically
- ✅ No auth required

---

## 🚀 How to Deploy

### Backend Setup

```bash
cd backend
npm install
npm run migrate          # Run all migrations
npm start              # Start server (or npm run dev for watch)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev            # Start dev server
# or
npm run build          # Production build
```

### Environment Variables

Create `.env` in backend folder:
```
DATABASE_URL=postgresql://user:password@localhost:5432/rsfitness
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
```

---

## 📋 Key Features Checklist

- ✅ Gym registration table created
- ✅ Gym owner signup auto-registers gym
- ✅ User signup validates gym exists
- ✅ Members tab displays gym members
- ✅ Gym owner sees only their gym members
- ✅ Members sorted by expiry date
- ✅ Days remaining calculated
- ✅ Member status displayed (active/expired)
- ✅ Search/filter members by name or plan
- ✅ Revenue tracking by member plan
- ✅ Member reminders via WhatsApp
- ✅ Payment history by month

---

## 🔍 Troubleshooting

### Members not showing?
- ✅ Ensure gym owner is logged in with valid JWT
- ✅ Check gym_name matches exactly (case-sensitive)
- ✅ Verify users have memberships with same gym_name

### Gym not appearing in dropdown?
- ✅ Ensure gym owner signup was completed
- ✅ Check `registered_gyms` table has the gym entry
- ✅ Call `/auth/gyms` to verify endpoint works

### User signup failing?
- ✅ Verify gym name exactly matches registered gym
- ✅ Check /auth/check-gym endpoint
- ✅ Ensure no duplicate email/phone

---

## 📁 File Locations

| Component | File | Purpose |
|-----------|------|---------|
| DB Schema | `backend/migrations/001-005*.sql` | Table definitions |
| Gym Owner Signup | `backend/src/controllers/gymOwnerController.js` | Registration logic |
| User Signup | `backend/src/controllers/authController.js` | User registration |
| Get Members | `backend/src/controllers/gymOwnerController.js` | Member retrieval |
| Auth Middleware | `backend/src/middleware/auth.js` | JWT verification |
| API Client | `frontend/src/services/api.js` | API calls |
| Auth UI | `frontend/src/components/auth/AuthScreen.jsx` | Login/signup forms |
| Dashboard | `frontend/src/components/gym-owner/GymOwnerDashboard.jsx` | Member display |

---

## 🎓 Summary

This implementation provides a complete end-to-end gym management system:

1. **Gyms are registered** when gym owners create accounts
2. **Users validate gym membership** during signup
3. **Gym owners manage members** through a dedicated dashboard
4. **Real-time member data** including expiry alerts and revenue tracking

The system is production-ready and can be extended with additional features like:
- Admin dashboard for system-wide analytics
- Batch member communications
- Subscription management
- Integration with payment gateways
