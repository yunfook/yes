"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOutIcon, PaletteIcon } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { ThemeDialog } from "@/components/theme-dialog";

function NavUserName({ name }: { name: string }) {
  return (
    <small
      className="flex-1"
      title={name}>
      <span className="truncate font-medium">{name}</span>
    </small>
  );
}

function ThemeButton({ onClick }: { onClick: () => void }) {
  return (
    <SidebarMenuButton
      tooltip="Theme"
      className="size-8 shrink-0 justify-center p-0"
      onClick={onClick}
      render={<button type="button" />}
    >
      <PaletteIcon className="size-4" />
    </SidebarMenuButton>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SidebarMenuButton
        tooltip="Log out"
        className="size-8 shrink-0 justify-center p-0 hover:bg-red-500 hover:text-white data-active:hover:bg-red-500 data-active:hover:text-white"
        render={<button type="submit" />}
      >
        <LogOutIcon className="size-4" />
      </SidebarMenuButton>
    </form>
  );
}

export function NavUser({
  user,
}: {
  user: { name: string; isAdmin: boolean };
}) {
  const [themeOpen, setThemeOpen] = React.useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-1">
          <NavUserName name={user.name} />
          <ThemeButton onClick={() => setThemeOpen(true)} />
          <LogoutButton />
        </SidebarMenuItem>
      </SidebarMenu>
      <ThemeDialog open={themeOpen} onOpenChange={setThemeOpen} />
    </>
  );
}
