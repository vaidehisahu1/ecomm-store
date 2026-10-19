"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/ui/tabs";

/** Tabs that open the panel named in the URL hash (e.g. #reviews), so in-page links land on the right tab. */
export function HashTabs({ defaultValue, values, children }: { defaultValue: string; values: string[]; children: React.ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (values.includes(hash)) setValue(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [values]);
  return (
    <Tabs value={value} onValueChange={setValue}>
      {children}
    </Tabs>
  );
}
