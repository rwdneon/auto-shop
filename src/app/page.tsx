import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow border p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold">Auto Shop Manager</h1>
        <p className="text-gray-500">Repair orders, parts, and profit tracking</p>
        <div className="space-y-3">
          <Link href="/repair-orders" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-medium">
            New Repair Order
          </Link>
          <Link href="/dashboard" className="block w-full border py-3 rounded-xl">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
