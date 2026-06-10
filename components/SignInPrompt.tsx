import Link from "next/link";
import { EmptyState } from "@/components/ui";

/** Shown on auth-gated routes when the visitor is not signed in. */
export function SignInPrompt({ feature }: { feature: string }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmptyState
        icon="user"
        title="Sign in required"
        subtitle={`Sign in to use ${feature}.`}
        action={
          <Link
            href="/login"
            style={{
              display: "inline-block",
              background: "var(--amber)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              padding: "9px 18px",
              borderRadius: "var(--r3)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        }
      />
    </div>
  );
}
