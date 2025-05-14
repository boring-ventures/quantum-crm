export default function RolesLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="h-10 w-60 bg-gray-200 rounded-md animate-pulse mb-2"></div>
        <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Filtros y acciones skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex flex-row gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Tabla skeleton */}
      <div className="rounded-md border">
        <div className="bg-gray-50 p-3">
          <div className="grid grid-cols-4 gap-4">
            <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-8 ml-auto bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
