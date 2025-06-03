"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_STORAGE_KEYS } from "@/services/api-config";

export default function DashboardTabsIndex() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    if (token) {
      // If token exists, redirect to default dashboard tab
      router.replace("/dashboard/tabs/my-sites");
    } else {
      // If no token, redirect to login
      router.replace("/auth/login");
    }
  }, [router]);

  return null; // or loading UI
}
