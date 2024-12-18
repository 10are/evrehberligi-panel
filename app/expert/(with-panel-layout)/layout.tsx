// app/expert/layout.tsx
"use client";

import { ReactNode } from 'react';
import { AppSidebar } from "@/app/components/expert/app-sidebar"
import { SidebarTrigger , SidebarProvider } from "@/components/ui/sidebar"


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
