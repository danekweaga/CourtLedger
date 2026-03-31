import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { getSession, onAuthStateChange, signIn, signUp } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { AuthForm } from "./AuthForm";
import { PublicHome } from "./PublicHome";

interface AuthGateProps {
  children: (session: Session) => ReactNode;
}

const AUTH_TOKEN_INVALID_EVENT = "courtledger:auth-token-invalid";
const AUTH_TOKEN_INVALID_RESET_KEY = "courtledger-auth-token-reset-once";

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setLoading(false);
        }
      })
      .catch((error: Error) => {
        toast.error(error.message);
        setLoading(false);
      });

    const { data } = onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_IN" && typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_TOKEN_INVALID_RESET_KEY);
      }
      if (event === "SIGNED_OUT" && !nextSession) {
        // Guard against transient signed-out events during token refresh races.
        void getSession()
          .then((latest) => {
            if (!mounted) {
              return;
            }
            setSession(latest ?? null);
          })
          .catch(() => {
            if (!mounted) {
              return;
            }
            setSession(null);
          });
        return;
      }
      setSession(nextSession ?? null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleAuthInvalid = () => {
      if (window.sessionStorage.getItem(AUTH_TOKEN_INVALID_RESET_KEY) === "1") {
        return;
      }
      window.sessionStorage.setItem(AUTH_TOKEN_INVALID_RESET_KEY, "1");
      void supabase.auth.signOut({ scope: "local" }).finally(() => {
        setSession(null);
        toast.error("Session reset due to stale auth token. Please sign in again.");
      });
    };
    window.addEventListener(AUTH_TOKEN_INVALID_EVENT, handleAuthInvalid as EventListener);
    return () => {
      window.removeEventListener(AUTH_TOKEN_INVALID_EVENT, handleAuthInvalid as EventListener);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthActionLoading(true);
    try {
      await signIn(email, password);
      toast.success("Logged in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string) => {
    setAuthActionLoading(true);
    try {
      await signUp(email, password);
      toast.success("Account created. Confirm email if prompted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed.");
    } finally {
      setAuthActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-300">Loading session...</div>;
  }

  if (!session) {
    if (!showAuthForm) {
      return <PublicHome onContinue={() => setShowAuthForm(true)} />;
    }
    return <AuthForm loading={authActionLoading} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return <>{children(session)}</>;
}
