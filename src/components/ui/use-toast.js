// src/components/ui/use-toast.js
import { useCallback } from "react";

export function useToast() {
  const toast = useCallback(({ title, description }) => {
    const msg = [title, description].filter(Boolean).join("\n");
    if (msg) alert(msg);
  }, []);

  return { toast };
}
