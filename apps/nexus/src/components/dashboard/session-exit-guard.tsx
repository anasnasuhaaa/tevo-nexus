"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

export function SessionExitGuard() {
  useEffect(() => {
    function handleBeforeUnload() {
      void authClient.signOut();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}