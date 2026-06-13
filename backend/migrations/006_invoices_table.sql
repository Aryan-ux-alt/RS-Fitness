-- Create invoices table for storing invoice records
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  gym_name text NOT NULL,
  plan_label text NOT NULL,
  months integer NOT NULL CHECK (months > 0),
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed', 'paid', 'cancelled')),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_membership_id ON invoices(membership_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add paid_date tracking to payment_transactions if not exists
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS refund_reason text;
