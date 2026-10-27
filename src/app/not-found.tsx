import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        The requested resource could not be found. Please return to the Client Overview.
      </p>
      <Link
        href="/clients"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
      >
        Back to Client Overview
      </Link>
    </div>
  );
}
