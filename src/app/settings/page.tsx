"use client";

import { Navbar } from "@/components/layout";
import { SettingsContent } from "@/features/settings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-8">Settings</h1>
          <SettingsContent />
        </div>
      </main>
    </div>
  );
}
