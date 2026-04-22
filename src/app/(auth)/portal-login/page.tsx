"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, Info } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

function PortalLoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params (from auth callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "auth_failed") {
      setError("Email verification failed or link expired. Please try again or request a new verification email.");
    }
  }, [searchParams]);

  // Registration state
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Forgot password state
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setRegistering(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setRegisterSuccess(true);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setRegistering(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/portal/profile`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setResetSent(true);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <Image
                src="/logo.png"
                alt="Amazon Christian Academy"
                width={80}
                height={80}
                className="rounded-xl shadow-lg"
              />
            </div>
            <div>
              <CardTitle className="text-2xl">The Pride</CardTitle>
              <CardDescription>
                Parent Portal
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Dialog open={forgotDialogOpen} onOpenChange={(open) => {
                    setForgotDialogOpen(open);
                    if (!open) {
                      setResetSent(false);
                      setForgotEmail("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we&apos;ll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      {resetSent ? (
                        <div className="py-6 text-center">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="font-semibold text-lg">Check Your Email</h3>
                          <p className="text-muted-foreground mt-2">
                            We&apos;ve sent a password reset link to {forgotEmail}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="forgot-email">Email Address</Label>
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="parent@email.com"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setForgotDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={sendingReset}>
                              {sendingReset ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Send Reset Link"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to Portal"
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Dialog open={registerDialogOpen} onOpenChange={(open) => {
                setRegisterDialogOpen(open);
                if (!open) {
                  setRegisterSuccess(false);
                  setRegisterEmail("");
                  setRegisterPassword("");
                  setRegisterConfirmPassword("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full">
                    Create New Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Parent Account</DialogTitle>
                    <DialogDescription>
                      Register for portal access. After registration, contact the school to link your account to your child(ren).
                    </DialogDescription>
                  </DialogHeader>
                  {registerSuccess ? (
                    <div className="py-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg">Registration Successful!</h3>
                      <p className="text-muted-foreground mt-2">
                        Please check your email to verify your account. Once verified, contact the school administration to link students to your account.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => setRegisterDialogOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email Address</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="parent@email.com"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-confirm">Confirm Password</Label>
                          <Input
                            id="register-confirm"
                            type="password"
                            placeholder="Confirm your password"
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRegisterDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={registering}>
                          {registering ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <p className="text-sm text-muted-foreground text-center">
                Staff member?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Staff Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">First time user?</p>
                <ul className="space-y-1">
                  <li>1. Click &quot;Create New Account&quot; to register</li>
                  <li>2. Verify your email address</li>
                  <li>3. Contact the school office to link your child(ren) to your account</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-primary/5 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PortalLoginContent />
    </Suspense>
  );
}
