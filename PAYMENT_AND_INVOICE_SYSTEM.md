# Payment & Invoice System Documentation

## Overview
Complete payment processing and invoicing system for gym membership subscriptions with database persistence.

## Database Schema

### 1. **memberships** Table
Stores membership subscription records for users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to users table |
| gym_name | text | Name of the gym user is billing for |
| plan_id | text | Plan identifier (monthly, quarterly, halfyearly, yearly) |
| plan_label | text | Human-readable plan label |
| months | integer | Number of months in subscription |
| amount_paise | integer | Amount in paise (100 paise = 1 rupee) |
| status | text | 'active', 'expired', 'cancelled' |
| start_date | date | Subscription start date |
| expiry_date | date | Subscription expiry date |
| created_at | timestamptz | Record creation timestamp |

### 2. **payment_transactions** Table
Stores payment transaction records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to users table |
| membership_id | uuid | Reference to memberships table |
| receipt_id | text | Unique receipt identifier |
| provider | text | Payment provider (default: 'demo') |
| provider_payment_id | text | External payment gateway ID |
| amount_paise | integer | Amount paid in paise |
| currency | char(3) | Currency code (default: 'INR') |
| status | text | 'paid', 'failed', 'refunded' |
| paid_at | timestamptz | Payment timestamp |
| refunded_at | timestamptz | Refund timestamp (if refunded) |
| refund_reason | text | Reason for refund |
| metadata | jsonb | Additional JSON metadata |

### 3. **invoices** Table
Stores invoice records for accounting and records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to users table |
| transaction_id | uuid | Reference to payment_transactions table |
| membership_id | uuid | Reference to memberships table |
| invoice_number | text | Unique invoice number (format: INV-YYYYMMDD-XXXX) |
| gym_name | text | Billing gym name |
| plan_label | text | Subscription plan label |
| months | integer | Subscription duration in months |
| amount_paise | integer | Invoice amount in paise |
| currency | char(3) | Currency (default: 'INR') |
| status | text | 'generated', 'sent', 'viewed', 'paid', 'cancelled' |
| invoice_date | date | Invoice generation date |
| due_date | date | Payment due date |
| paid_date | date | Actual payment date |
| notes | text | Additional notes |
| metadata | jsonb | Additional JSON data |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Database Migrations

### Migration File: `006_invoices_table.sql`
Creates the invoices table and related indexes for performance optimization.

## API Endpoints

### 1. Create Membership Payment
**POST** `/api/memberships/payments`

Creates a membership, payment transaction, and invoice in a single atomic transaction.

**Request Body:**
```json
{
  "gymName": "RS Fitness Gym",
  "planId": "monthly",
  "planLabel": "MONTHLY",
  "months": 1,
  "amount": 1000,
  "receiptId": "RS-20260613-1234",
  "startDate": "2026-06-13",
  "expiryDate": "2026-07-13"
}
```

**Response:**
```json
{
  "membership": { /* membership record */ },
  "transaction": { /* payment_transactions record */ },
  "invoice": { /* invoices record */ }
}
```

### 2. Get User Invoices
**GET** `/api/memberships/invoices`

Retrieves all invoices for the authenticated user, ordered by date (newest first).

**Response:**
```json
[
  {
    "id": "uuid",
    "invoice_number": "INV-20260613-1234",
    "gym_name": "RS Fitness Gym",
    "plan_label": "MONTHLY",
    "amount_paise": 100000,
    "status": "paid",
    "invoice_date": "2026-06-13",
    "paid_date": "2026-06-13"
  }
]
```

### 3. Get Invoice Details
**GET** `/api/memberships/invoices/:invoiceId`

Retrieves detailed information for a specific invoice.

**Response:**
```json
{
  "id": "uuid",
  "invoice_number": "INV-20260613-1234",
  "gym_name": "RS Fitness Gym",
  "plan_label": "MONTHLY",
  "months": 1,
  "amount_paise": 100000,
  "status": "paid",
  "invoice_date": "2026-06-13",
  "paid_date": "2026-06-13",
  "payment_status": "paid",
  "provider": "demo",
  "start_date": "2026-06-13",
  "expiry_date": "2026-07-13"
}
```

### 4. Get User Payment Transactions
**GET** `/api/memberships/transactions`

Retrieves all payment transactions for the user with membership details.

**Response:**
```json
[
  {
    "id": "uuid",
    "receipt_id": "RS-20260613-1234",
    "amount_paise": 100000,
    "status": "paid",
    "paid_at": "2026-06-13T10:30:00Z",
    "gym_name": "RS Fitness Gym",
    "plan_label": "MONTHLY",
    "months": 1
  }
]
```

## Frontend Integration

### API Service Functions

**File:** `frontend/src/services/api.js`

```javascript
// Create membership payment
createMembershipPayment(payload)

// Fetch all invoices
getUserInvoices()

// Fetch specific invoice
getInvoiceDetails(invoiceId)

// Fetch payment transactions
getUserPaymentTransactions()
```

### Component Updates

**File:** `frontend/src/components/subscriptions/SubscriptionPanel.jsx`

- Displays pricing plans with selection
- Shows payment review before completing checkout
- Displays transaction history from database
- Properly formats amounts from paise to rupees

## Invoice Generation

### Invoice Number Format
- Format: `INV-YYYYMMDD-XXXX`
- Example: `INV-20260613-1234`
- Guarantees uniqueness per day with random 4-digit suffix

### Auto-Generated Invoice Data
When a payment is created, the system automatically:
1. Generates unique invoice number
2. Creates membership record with dates
3. Records payment transaction with provider info
4. Creates invoice with status 'paid'
5. All within a single atomic database transaction

## Data Flow

```
User Selects Plan
    ↓
Reviews Payment Details
    ↓
Completes Checkout (onPay)
    ↓
API: POST /memberships/payments
    ↓
Backend Transaction:
  - Create membership
  - Create payment_transaction
  - Create invoice
  - Commit all or rollback
    ↓
Response with all records
    ↓
Frontend: Update subscription state + localStorage
    ↓
Display success & update transaction history
```

## Amount Storage

All amounts are stored in **paise** (100 paise = 1 rupee) to avoid floating-point precision issues:

```javascript
// Conversion
amountPaise = amount * 100
amountRupees = amountPaise / 100
```

## Transaction Safety

Payment operations use database transactions to ensure atomicity:
- If any step fails, entire transaction is rolled back
- No partial payment records are created
- Consistent state guaranteed

## Error Handling

The system handles common errors:
- Invalid payment data (validation with Zod)
- Database constraint violations
- Missing required fields
- Authorization failures (user ownership validation)

## Future Enhancements

1. **Real Payment Gateway Integration**
   - Razorpay, PayPal, Stripe
   - Webhook handling for payment confirmations
   - Automatic invoice updates on payment completion

2. **Invoice Features**
   - PDF generation and download
   - Email delivery
   - Invoice tracking status (sent, viewed, etc.)
   - Recurring invoice automation

3. **Refund Management**
   - Partial refunds
   - Refund reason tracking
   - Automatic membership cancellation

4. **Financial Reports**
   - Revenue analytics
   - Payment trend analysis
   - Tax reporting exports
