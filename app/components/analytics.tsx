"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPage } from "@/lib/analytics";

export default function ProductAnalytics() {
  const pathname = usePathname();
  useEffect(() => { trackPage(pathname); }, [pathname]);
  return null;
}
