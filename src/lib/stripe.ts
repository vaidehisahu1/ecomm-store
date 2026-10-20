import "server-only";
import Stripe from "stripe";

/** Stripe is optional: without a secret key the store falls back to the built-in mock processor. */
export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
