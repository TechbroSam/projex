// src/app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient, Plan } from '@prisma/client';
import { stripe } from '@/lib/stripe';

const prisma = new PrismaClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  const session = event.data.object as any;
  const stripeCustomerId = session.customer;

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'Customer ID not found.' }, { status: 400 });
  }

  // --- HANDLE SUBSCRIPTION EVENTS ---
  try {
    let userEmail: string | null = null;

    // Retrieve the full customer object from Stripe to get their email
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer && 'email' in customer) {
        userEmail = customer.email;
    }

    if (!userEmail) {
        return NextResponse.json({ error: 'Customer email not found.' }, { status: 400 });
    }

    // Event: A new subscription is created or an existing one is updated/renewed
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      await prisma.user.update({
        // Use the reliable unique email to find the user
        where: { email: userEmail },
        data: { plan: Plan.PREMIUM },
      });
    }

    // Event: A subscription is cancelled or ends
    if (event.type === 'customer.subscription.deleted') {
      await prisma.user.update({
        where: { email: userEmail },
        data: { plan: Plan.FREE },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error.';
    console.error("Webhook database update failed:", error);
    return NextResponse.json({ error: 'Database update failed.', details: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}