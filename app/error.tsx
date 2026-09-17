"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Trust.Me route error", error);
  }, [error]);

  return (
    <main className="profilePage">
      <section className="profileGate">
        <ShieldAlert size={28} aria-hidden="true" />
        <span className="kicker">TRUST.ME · TEMPORARY ERROR</span>
        <h1>Something went wrong.</h1>
        <p>We couldn&apos;t load this page correctly. Try again, or return to Trust.Me.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="primary" onClick={() => reset()}><RefreshCw size={16} /> Try again</button>
          <Link className="secondaryButton" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
