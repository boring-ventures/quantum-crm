export default function SettingsLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Settings Form Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse mb-4"></div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="h-px w-full bg-gray-200"></div>

      {/* Password Form Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-4"></div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
