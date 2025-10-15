// src/app/verify-email/page.tsx
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Check Your Email</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        We&apos;ve sent a verification link to your email address. Please click the link in the email to activate your account.
      </p>
      <Link href="/login" className="mt-8 inline-block text-sm text-orange-600 hover:underline">
        Back to Login
      </Link>
    </div>
  );
}