// src/components/Footer.tsx
export default function Footer() {
  return (
    // The mt-auto class has been removed from here
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} ProjeXY. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}