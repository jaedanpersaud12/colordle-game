"use client";

import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, UserPlus, Shield, Mail, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const supabase = createClient();
  const [view, setView] = useState<
    "sign_in" | "sign_up" | "forgotten_password"
  >("sign_in");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // Close modal and redirect to onboarding when user successfully logs in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        onOpenChange(false);
        // Redirect to onboarding - the onboarding page will handle
        // redirecting back to home if already completed
        window.location.href = "/onboarding";
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, onOpenChange]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetMessage("Password reset email sent! Check your inbox.");
      setResetEmail("");
    } catch (error: any) {
      setResetError(error.message || "Failed to send reset email");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle>
            {view === "forgotten_password"
              ? "Reset Your Password"
              : view === "sign_in"
              ? "Welcome Back"
              : "Create Your Account"}
          </DialogTitle>
        </DialogHeader>
        <div>
          {view === "forgotten_password" ? (
            <div className="space-y-4 py-4">
              <button
                type="button"
                onClick={() => setView("sign_in")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>

              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-email"
                    className="text-sm font-bold block"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-border bg-background text-foreground rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 text-sm">
                    {resetError}
                  </div>
                )}

                {resetMessage && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 text-sm">
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-foreground text-background font-semibold border border-border hover:opacity-90 transition-opacity"
                >
                  Send Reset Link
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Buttons */}
              <div className="flex gap-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => setView("sign_in")}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2 ${
                    view === "sign_in"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                  {view === "sign_in" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setView("sign_up")}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2 ${
                    view === "sign_up"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                  {view === "sign_up" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                  )}
                </button>
              </div>

              {/* Auth Form */}
              <div className="pb-0.5">
                <Auth
                  supabaseClient={supabase}
                  view={view}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: "#171717",
                          brandAccent: "#404040",
                        },
                      },
                    },
                    className: {
                      button: "!rounded-none !border !border-border",
                      input: "!rounded-none !border !border-border",
                      anchor: "!text-foreground !underline hover:!no-underline",
                      message:
                        "!text-sm !border !border-border !rounded-none !p-3",
                    },
                  }}
                  providers={["google"]}
                  showLinks={false}
                  redirectTo={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/onboarding`}
                />

                {view === "sign_in" && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => setView("forgotten_password")}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Text */}
              <div className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  {view === "sign_in" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setView("sign_up")}
                        className="text-foreground underline hover:no-underline font-semibold"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setView("sign_in")}
                        className="text-foreground underline hover:no-underline font-semibold"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
