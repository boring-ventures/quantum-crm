export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg p-6 h-48 animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}
