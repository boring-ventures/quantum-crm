export default function ProductsLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Search and Actions Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Card Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Card Header */}
        <div className="p-6 space-y-2 border-b">
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-4 w-60 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-t-lg mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-5 bg-gray-200 rounded-md animate-pulse"
              ></div>
            ))}
          </div>

          {/* Table Rows */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-3 border-b">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div
                    key={j}
                    className="h-5 bg-gray-200 rounded-md animate-pulse"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
