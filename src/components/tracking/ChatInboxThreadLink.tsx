"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

export function ChatInboxThreadLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackProductEvent({
          event: "chat_open",
          location: "chat_inbox",
          label: "thread_row",
          href,
        })
      }
    >
      {children}
    </Link>
  );
}
