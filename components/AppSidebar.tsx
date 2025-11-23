"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { trpc } from "@/lib/trpc/client";
import { getReadableTextColor } from "@/lib/color-utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { HelpCircle, BarChart3, Settings, LogOut, LogIn, X } from "lucide-react";
import { AuthModal } from "./AuthModal";

interface AppSidebarProps {
  onHelpClick: () => void;
  onStatsClick: () => void;
  onSignInClick?: () => void;
}

export function AppSidebar({
  onHelpClick,
  onStatsClick,
  onSignInClick,
}: AppSidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setOpen } = useSidebar();
  const supabase = createClient();
  const { data: dbUser } = trpc.auth.getCurrentUser.useQuery();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  const handleSignInClick = () => {
    onSignInClick?.();
    setShowAuthModal(true);
    setOpen(false);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="flex flex-row items-center justify-between">
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Colordle
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 hover:bg-sidebar-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </SidebarHeader>

        <SidebarContent>
          {/* User section */}
          {!loading && (
            <SidebarGroup className="border-b border-sidebar-border pb-4">
              <SidebarGroupContent>
                {user ? (
                  <div className="px-3 py-2">
                    <div
                      className="mb-2 inline-block rounded-md px-3 py-1.5 text-sm font-bold"
                      style={
                        dbUser?.profileColor
                          ? {
                              backgroundColor: dbUser.profileColor,
                              color: getReadableTextColor(dbUser.profileColor),
                            }
                          : {
                              backgroundColor: "var(--sidebar-accent)",
                              color: "var(--sidebar-accent-foreground)",
                            }
                      }
                    >
                      @{dbUser?.username || "user"}
                    </div>
                    <p className="px-3 text-xs text-sidebar-foreground/70 truncate">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleSignInClick}>
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Main menu */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleMenuClick(onHelpClick)}>
                    <HelpCircle className="h-5 w-5" />
                    <span>How to Play</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleMenuClick(onStatsClick)}>
                    <BarChart3 className="h-5 w-5" />
                    <span>Statistics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      onClick={() => setOpen(false)}
                    >
                      <a href="/settings" className="flex items-center gap-3">
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with sign out */}
        {user && (
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
