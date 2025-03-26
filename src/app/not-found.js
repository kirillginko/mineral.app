import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="mb-8">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
