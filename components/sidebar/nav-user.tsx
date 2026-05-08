"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export function NavUser({
  user,
}: {
  user: { name: string; isAdmin: boolean };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <form action={logoutAction}>
          <SidebarMenuButton
            tooltip="Log out"
            render={<button type="submit" />}
          >
            <span className="truncate font-medium">{user.name}</span>
            <LogOutIcon className="ml-auto size-4" />
          </SidebarMenuButton>
        </form>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
