// src/app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient, Plan } from "@prisma/client";
import { stripe } from "@/lib/stripe";

const prisma = new PrismaClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // --- HANDLE SUBSCRIPTION EVENTS ---
  try {
    let stripeCustomerId: string | undefined;

    // Check for the relevant subscription events
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      // FIX: Cast the object to a Stripe.Subscription to access its properties safely
      const subscription = event.data.object as Stripe.Subscription;
      const customer = subscription.customer;

      if (typeof customer === "string") {
        stripeCustomerId = customer;
      } else {
        stripeCustomerId = customer.id;
      }
    }

    if (stripeCustomerId) {
      if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: stripeCustomerId },
          data: { plan: Plan.PREMIUM },
        });
      }

      if (event.type === "customer.subscription.deleted") {
        await prisma.user.updateMany({
          where: { stripeCustomerId: stripeCustomerId },
          data: { plan: Plan.FREE },
        });
      }
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error.";
    console.error("Webhook database update failed:", error);
    return NextResponse.json(
      { error: "Database update failed.", details: errorMessage },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
