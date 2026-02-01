/**
 * Empire Portal - Home Page
 * Main dashboard overview
 */

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Empire Portal</h1>
      <p className="mt-4 text-lg text-gray-600">
        Unified command center for Keystone Business Group
      </p>
      <div className="mt-8">
        <p className="text-sm text-gray-500">Framework: Next.js 15 | App Router</p>
      </div>
    </div>
  );
}
