"use client";

import { Navbar } from "@/components/layout";
import { LibraryContent } from "@/features/library";

export default function LibraryPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-8">
        <LibraryContent />
      </main>
    </div>
  );
}
