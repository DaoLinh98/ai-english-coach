"use client";

import React from "react";
import { useActionState } from "react";
import { Button, Icon } from "@/components/ui";
import { signIn, signUp, type AuthState } from "../actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r3)",
  fontFamily: "var(--font)",
  color: "var(--t1)",
  outline: "none",
  background: "var(--surface)",
};

export default function LoginPage() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div
        className="a-pop"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--surface)",
          borderRadius: "var(--r5)",
          boxShadow: "var(--sh2)",
          border: "1px solid var(--bord2)",
          padding: "36px 32px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r3)",
              background: "linear-gradient(135deg, var(--amber), var(--orange))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(245,158,11,.35)",
            }}
          >
            <Icon name="zap" size={20} color="#fff" sw={2.2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--t1)" }}>
              EnglishCoach
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)" }}>AI-Powered</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)", marginBottom: 4 }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 22 }}>
          {mode === "signin"
            ? "Sign in to continue improving your writing."
            : "Start writing better English today."}
        </p>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input name="name" placeholder="Name" style={inputStyle} autoComplete="name" />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            style={inputStyle}
            autoComplete="email"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            style={inputStyle}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />

          {state.error && (
            <p style={{ fontSize: 12, color: "var(--red)" }}>{state.error}</p>
          )}
          {state.message && (
            <p style={{ fontSize: 12, color: "var(--green)" }}>{state.message}</p>
          )}

          <Button variant="primary" size="md" full loading={pending}>
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 18, textAlign: "center" }}>
          {mode === "signin" ? "No account yet? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              background: "none",
              border: "none",
              color: "var(--amber-d)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontSize: 13,
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
