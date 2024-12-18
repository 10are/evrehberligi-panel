import * as React from "react"
import { Users, BarChart2, Settings, Home, LogOut } from "lucide-react"
import {   
  Sidebar,   
  SidebarContent,   
  SidebarGroup,   
  SidebarHeader,   
  SidebarMenu,   
  SidebarMenuButton,   
  SidebarMenuItem,   
  SidebarRail, 
} from "@/components/ui/sidebar"

const expertNavigation = [
  {
    title: "Ana Sayfa",
    url: "/expert",
    icon: <Home className="size-4" />
  },
  {
    title: "Ailelerim",
    url: "/expert/families",
    icon: <Users className="size-4" />
  },  {
    title: "Raporlarım",
    url: "/expert/past",
    icon: <Users className="size-4" />
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const handleLogout = () => {
    // Clear all relevant cookies
    const cookies = [
      'auth_token', 
      'user_email', 
      'user_id', 
      'user_role', 
      'sidebar:state'
    ];

    cookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Redirect to login page
    window.location.href = '/login';
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/expert">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Users className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Ev Okulu Derneği</span>
                  <span className="">Ev Rehberliği Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {expertNavigation.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    <span className="mr-2">{item.icon}</span>
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            {/* New Logout MenuItem */}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <span className="mr-2"><LogOut className="size-4" /></span>
                Çıkış Yap
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}