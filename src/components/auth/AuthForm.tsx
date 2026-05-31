import { useState, type FormEvent } from "react";
import { CourtLedgerLogo } from "../branding/CourtLedgerLogo";

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

export function AuthForm({ onLogin, onSignup, loading }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "login") {
      await onLogin(email, password);
    } else {
      await onSignup(email, password);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
      <div className="flex flex-col items-center text-center">
        <CourtLedgerLogo className="h-20 w-auto" />
        <p className="mt-2 text-sm text-slate-400">NBA bet tracking dashboard</p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Email</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Password</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm text-indigo-300 hover:text-indigo-200"
        onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
