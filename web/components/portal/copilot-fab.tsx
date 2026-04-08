"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { CopilotDrawer } from "./copilot-drawer";

export function CopilotFAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ed854b] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all" aria-label="Abrir Copilot">
        <MessageCircle size={24} />
      </button>
      {open && <CopilotDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
