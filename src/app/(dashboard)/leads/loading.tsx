export default function LeadsLoading() {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Actions Bar Skeleton */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-10 flex-1 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="border rounded-lg p-4">
            <div className="h-10 bg-gray-200 rounded-md animate-pulse mb-4"></div>

            {/* Leads List Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 rounded-md animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:w-80 space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
