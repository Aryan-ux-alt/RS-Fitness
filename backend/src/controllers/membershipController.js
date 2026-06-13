import { z } from "zod";
import { pool } from "../db/pool.js";

const membershipSchema = z.object({
  gymName: z.string().min(1),
  planId: z.string().min(1),
  planLabel: z.string().min(1),
  months: z.coerce.number().int().positive(),
  amount: z.coerce.number().nonnegative(),
  receiptId: z.string().min(1),
  startDate: z.string().date(),
  expiryDate: z.string().date(),
});

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

export async function createMembershipPayment(req, res, next) {
  const client = await pool.connect();
  try {
    const m = membershipSchema.parse(req.body);
    const amountPaise = Math.round(m.amount * 100);
    const invoiceNumber = generateInvoiceNumber();
    
    await client.query("BEGIN");
    
    // 1. Create membership record
    const membership = await client.query(
      `INSERT INTO memberships (user_id, gym_name, plan_id, plan_label, months, amount_paise, start_date, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.sub, m.gymName, m.planId, m.planLabel, m.months, amountPaise, m.startDate, m.expiryDate],
    );
    
    // 2. Create payment transaction
    const tx = await client.query(
      `INSERT INTO payment_transactions (user_id, membership_id, receipt_id, amount_paise, status, provider, provider_payment_id)
       VALUES ($1, $2, $3, $4, 'paid', 'demo', $5) RETURNING *`,
      [req.user.sub, membership.rows[0].id, m.receiptId, amountPaise, m.receiptId],
    );
    
    // 3. Create invoice record
    const invoice = await client.query(
      `INSERT INTO invoices (user_id, transaction_id, membership_id, invoice_number, gym_name, plan_label, months, amount_paise, status, invoice_date, paid_date, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'paid', CURRENT_DATE, CURRENT_DATE, $9) RETURNING *`,
      [req.user.sub, tx.rows[0].id, membership.rows[0].id, invoiceNumber, m.gymName, m.planLabel, m.months, amountPaise, JSON.stringify({ receiptId: m.receiptId, planId: m.planId })],
    );
    
    await client.query("COMMIT");
    
    res.status(201).json({
      membership: membership.rows[0],
      transaction: tx.rows[0],
      invoice: invoice.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// Get user's invoices
export async function getUserInvoices(req, res, next) {
  try {
    const invoices = await pool.query(
      `SELECT * FROM invoices WHERE user_id = $1 ORDER BY invoice_date DESC`,
      [req.user.sub],
    );
    res.json(invoices.rows);
  } catch (err) {
    next(err);
  }
}

// Get user's payment transactions
export async function getUserPaymentTransactions(req, res, next) {
  try {
    const transactions = await pool.query(
      `SELECT t.*, m.gym_name, m.plan_label, m.months
       FROM payment_transactions t
       LEFT JOIN memberships m ON t.membership_id = m.id
       WHERE t.user_id = $1
       ORDER BY t.paid_at DESC`,
      [req.user.sub],
    );
    res.json(transactions.rows);
  } catch (err) {
    next(err);
  }
}

// Get invoice details by ID
export async function getInvoiceDetails(req, res, next) {
  try {
    const { invoiceId } = req.params;
    const invoice = await pool.query(
      `SELECT i.*, t.provider, t.status as payment_status, m.start_date, m.expiry_date
       FROM invoices i
       LEFT JOIN payment_transactions t ON i.transaction_id = t.id
       LEFT JOIN memberships m ON i.membership_id = m.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [invoiceId, req.user.sub],
    );
    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice.rows[0]);
  } catch (err) {
    next(err);
  }
}

