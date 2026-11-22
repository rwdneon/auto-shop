import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-black rounded-2xl shadow border p-8 text-center space-y-6">
        <img 
          src="/rocket-logo.png" 
          alt="RO-CKET" 
          className="w-80 mx-auto"
        />
       
      <div className="space-y-3">

         <Link href="/dashboard">
  <img 
    src="/mission-control.png" 
    alt="dashboard" 
    className="h-12 mx-auto"
  />
</Link>
        </div>
      </div>
    </main>
  );
}