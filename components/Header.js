"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";

export default function Header({ user, onMenuClick }) {
  const { logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    router.push("/dashboard/tabs/profile");
  };

  return (
    <header
      className="flex items-center justify-between text-white h-16 px-6 relative shadow-md"
      style={{
        backgroundImage: "linear-gradient(to right, #1e3c72, #2a5298)",
      }}
    >
      {/* Mobile hamburger button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Title: SwiftAds on mobile, Dashboard on desktop */}
      <div className="text-lg font-semibold">
        <span className="block md:hidden">
          <Image
            src="/images/Swift_Logo_Dark_Transparent_2.png"
            alt="USDT Logo"
            width={220}
            height={60}
            priority
          />
        </span>{" "}
        {/* mobile */}
        <span className="hidden md:block">Dashboard</span> {/* desktop */}
      </div>

      {/* User section */}
      <div
        className="flex items-center space-x-3 cursor-pointer relative"
        ref={dropdownRef}
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        <FaUserCircle size={28} className="text-white" />
        <span className="hidden sm:inline text-white font-semibold select-none">
          {user?.email || "User"}
        </span>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded shadow-lg text-black z-50">
            <button
              onClick={handleProfileClick}
              className="w-full text-left px-4 py-2 hover:bg-indigo-600 hover:text-white transition"
              type="button"
            >
              Profile
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-indigo-600 hover:text-white transition"
              type="button"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
