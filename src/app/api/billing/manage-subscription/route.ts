// src/app/api/billing/manage-subscription/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { PrismaClient, Plan } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse('User not found', { status: 404 });

  const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL!;

  // If user is already on premium, send them to manage their subscription
  if (user.plan === Plan.PREMIUM && user.stripeCustomerId) {
    const billingPortalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
    });
    return NextResponse.json({ url: billingPortalSession.url });
  }

  // If user is on free plan, create a checkout session to upgrade
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: session.user.email! });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const stripeCheckoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
    // FIX: Redirect to the main dashboard after success
    success_url: `${origin}/dashboard?subscription_success=true`,
    cancel_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: stripeCheckoutSession.url });
}