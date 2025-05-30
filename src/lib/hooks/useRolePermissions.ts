"use client";

import { useUserStore } from "@/store/userStore";
import { hasPermission } from "@/lib/utils/permissions";

export function useRolePermissions() {
  const { user } = useUserStore();
  const canViewSection = (sectionKey: string) =>
    hasPermission(user, sectionKey, "view");
  return { canViewSection };
}
