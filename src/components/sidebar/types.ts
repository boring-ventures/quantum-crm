import type { LucideIcon } from "lucide-react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface Team {
  name: string;
  logo: LucideIcon;
  plan: string;
}

interface BaseNavItem {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  subtitle?: string;
  key?: string;
  parentKey?: string;
}

export interface NavLink extends BaseNavItem {
  url: string;
  items?: never;
}

export interface NavCollapsible extends BaseNavItem {
  items: NavLink[];
  url?: never;
}

export type NavItem = NavLink | NavCollapsible;
export type SidebarNavItem = NavLink;

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface SidebarData {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
}

export type NavGroupProps = NavGroup;
