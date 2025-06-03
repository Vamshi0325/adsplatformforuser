"use client";

import Image from "next/image";
import React from "react";

export default function Sidebar({ tabs, activeTab, onTabClick, className }) {
  return (
    <nav
      className={`${className} fixed inset-y-0 left-0 z-40 w-56 bg-indigo-700 text-white border-r border-indigo-900
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
      `}
      aria-label="Sidebar navigation"
       style={{
        backgroundImage: "linear-gradient(to right, #1e3c72, #2a5298)",
      }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center h-16 font-bold text-xl">
        {/* <Image src="/images/Swift_Logo_Light_Transparent.png" alt="Logo" /> */}
        <Image
          src="/images/Swift_Logo_Dark_Transparent_2.png"
          alt="USDT Logo"
          width={200}
          height={60}
          priority
        />
      </div>

      {/* Tabs */}
      <div className="flex-1 p-4 space-y-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabClick(id)}
            className={`block w-full text-left px-4 py-2 rounded-md font-medium transition
              ${
                activeTab === id
                  ? "bg-indigo-900 text-white"
                  : "text-indigo-200 hover:bg-indigo-600 hover:text-white"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
