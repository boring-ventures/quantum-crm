import { useQuery } from "@tanstack/react-query";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      return response.json();
    },
  });
}
