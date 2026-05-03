import { Spinner } from "@/components/ui/spinner";

/**
 * Global loading component for Next.js App Router
 * 
 * This component is automatically shown by Next.js when:
 * - Navigating between pages
 * - Loading page data
 * - Suspense boundaries are triggered
 * 
 * It provides a consistent loading experience across the entire app.
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        <Spinner size="xl" />
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-full bg-arena-cyan/5 blur-2xl scale-[3]" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-gray-300 font-medium font-heading">Preparing the Arena...</p>
        <p className="text-xs text-gray-500">Loading content</p>
      </div>
    </div>
  );
}

// Made with Bob
