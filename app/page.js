"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_STORAGE_KEYS } from "@/services/api-config";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    if (token) {
      router.replace("/dashboard/tabs/my-sites");
    } else {
      // router.replace("/auth/login");
      router.replace("/index.html");
    }
  }, [router]);

  return null; // or a loading spinner
}
