import {
  Command,
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  User,
  CalendarCheck,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Quantum CRM",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Leads",
          url: "/leads",
          icon: User,
        },
        {
          title: "Ventas",
          url: "/ventas",
          icon: ShoppingCart,
        },
        {
          title: "Reportes",
          url: "/reportes",
          icon: BarChart3,
        },
        {
          title: "Tareas",
          url: "/tareas",
          icon: CalendarCheck,
        },
        {
          title: "Usuarios",
          url: "/users",
          icon: Users,
        },
      ],
    },
  ],
};
