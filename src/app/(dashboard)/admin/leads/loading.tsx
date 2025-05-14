export default function LeadsConfigLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="h-10 w-60 bg-gray-200 rounded-md animate-pulse mb-2"></div>
        <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-7 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
