"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathname = useRef(pathname);

  // Hide overlay when navigation completes (pathname changed)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setLoading(false);
    }
  }, [pathname]);

  // Show overlay when any internal link is clicked
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, mailto, tel
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto") ||
        href.startsWith("tel")
      )
        return;

      // Skip if it's the current page
      if (href === pathname || href === window.location.pathname) return;

      // Skip if modifier keys held (open in new tab etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      setLoading(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-150">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 rounded-full border-[2.5px] border-orange-500/25 border-t-orange-500 animate-spin" />
      </div>
    </div>
  );
}
