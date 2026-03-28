import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { getSession, onAuthStateChange, signIn, signUp } from "../../lib/auth";
import { AuthForm } from "./AuthForm";

interface AuthGateProps {
  children: (session: Session) => ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

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

    const { data } = onAuthStateChange((nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
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
    return <AuthForm loading={authActionLoading} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return <>{children(session)}</>;
}
