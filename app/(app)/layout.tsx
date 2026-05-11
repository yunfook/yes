import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { FloatingChat } from "@/components/floating-chat";
import { requireSession, getAccessibleAreas } from "@/lib/authz";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const areas = await getAccessibleAreas(session);

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar
          user={{
            name: session.name,
            email: session.email,
            isAdmin: session.isAdmin,
          }}
          areas={areas.map((a) => ({ id: a.id, name: a.name }))}
        />
        <SidebarInset className="bg-muted/50">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="text-sm font-medium">HR</span>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        </SidebarInset>
        <Toaster />
        {session.isAdmin && <FloatingChat />}
      </SidebarProvider>
    </QueryProvider>
  );
}
