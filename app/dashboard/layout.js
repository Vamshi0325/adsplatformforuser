"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const tabs = [
  { id: "my-sites", label: "My Sites" },
  { id: "statistics", label: "Statistics" },
  { id: "payments", label: "Payments" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "profile", label: "Profile" },
  { id: "help-support", label: "Help & Support" },
];

export default function DashboardLayout({ children }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // Set active tab from URL on mount or route change
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }
      const pathParts = window.location.pathname.split("/");
      const currentTab = pathParts[3] || "my-sites";
      setActiveTab(currentTab);
    }
  }, [isLoading, isAuthenticated, router]);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function handleTabClick(tabId) {
    setActiveTab(tabId);
    setSidebarOpen(false);
    router.push(`/dashboard/tabs/${tabId}`);
  }

  if (isLoading) {
    // Show loading spinner or placeholder while auth checks
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-bg flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        className={`fixed inset-y-0 left-0 z-40 w-56
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Fixed header wrapper */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Header user={user} onMenuClick={toggleSidebar} />
        </div>

        {/* Main content with padding top = header height */}
        <main className="main-content-bg flex-1 mt-16 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
