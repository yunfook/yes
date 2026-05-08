"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  UserPlusIcon,
  MapPinIcon,
  ShieldIcon,
} from "lucide-react";
import { AreaSwitcher } from "./area-switcher";
import { NavMain, type NavItem } from "./nav-main";
import { NavUser } from "./nav-user";
import { AreaSettingsMenuItem } from "./area-settings-menu-item";
import { PositionsMenuItem } from "./positions-menu-item";
import { DepartmentsMenuItem } from "./departments-menu-item";
import { SalaryTypesMenuItem } from "./salary-types-menu-item";

type Area = { id: number; name: string };
type SessionUser = { name: string; email: string; isAdmin: boolean };

export function AppSidebar({
  user,
  areas,
  ...props
}: {
  user: SessionUser;
  areas: Area[];
} & React.ComponentProps<typeof Sidebar>) {
  const fastLink: NavItem[] = [
    { title: "Create employee", href: "/employees/new", icon: UserPlusIcon, preserveArea: true },
  ];

  const main: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon, preserveArea: true },
    { title: "Employees", href: "/employees", icon: UsersIcon, preserveArea: true },
  ];

  const admin: NavItem[] = [
    { title: "Users", href: "/admin/users", icon: ShieldIcon },
    { title: "Areas", href: "/admin/areas", icon: MapPinIcon },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <AreaSwitcher areas={areas} isAdmin={user.isAdmin} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Fast Link" items={fastLink} />
        <NavMain label="Main" items={main} />
        <NavMain label="Library" items={[]}>
          <PositionsMenuItem areas={areas} />
          <DepartmentsMenuItem areas={areas} />
          <SalaryTypesMenuItem areas={areas} />
          <AreaSettingsMenuItem areas={areas} />
        </NavMain>
        {user.isAdmin && <NavMain label="Admin" items={admin} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
