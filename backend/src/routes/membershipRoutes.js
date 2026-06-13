import { Router } from "express";
import { createMembershipPayment, getUserInvoices, getUserPaymentTransactions, getInvoiceDetails } from "../controllers/membershipController.js";

export const membershipRoutes = Router();

// Payment and Membership endpoints
membershipRoutes.post("/payments", createMembershipPayment);
membershipRoutes.get("/invoices", getUserInvoices);
membershipRoutes.get("/invoices/:invoiceId", getInvoiceDetails);
membershipRoutes.get("/transactions", getUserPaymentTransactions);
