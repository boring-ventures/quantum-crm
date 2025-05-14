export default function UsersLoading() {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Actions Bar Skeleton */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="h-10 w-80 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-100 p-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 bg-gray-200 rounded-md animate-pulse"
            ></div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="grid grid-cols-5 p-4 gap-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div
                  key={j}
                  className="h-6 bg-gray-200 rounded-md animate-pulse"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
