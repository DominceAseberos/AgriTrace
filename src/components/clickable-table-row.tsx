"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

export function ClickableTableRow({
  href,
  label,
  children,
  className = "",
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const navigate = () => router.push(href);

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.defaultPrevented) return;
    navigate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer transition hover:bg-slate-50/90 focus-visible:bg-cyan-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6f78]/35 ${className}`}
    >
      {children}
    </tr>
  );
}
