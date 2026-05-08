"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  preserveArea?: boolean;
};

export function NavMain({
  label,
  items,
  children,
}: {
  label: string;
  items: NavItem[];
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const area = searchParams.get("area");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const href =
            item.preserveArea && area
              ? `${item.href}?area=${area}`
              : item.href;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={active}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        {children}
      </SidebarMenu>
    </SidebarGroup>
  );
}
