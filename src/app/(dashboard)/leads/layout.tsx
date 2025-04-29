export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
  params: any;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
  );
}
