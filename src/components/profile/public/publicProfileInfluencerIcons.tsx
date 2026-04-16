import type { SVGProps } from "react";
import { outlineIconBase } from "@/components/icons/iconStroke";

const stroke = outlineIconBase;

/** Tek stroke ailesi — küçük, sade (24 outline tarzı). */
export function PublicProfileIconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

export function PublicProfileIconShieldCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

export function PublicProfileIconBriefcase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M20.25 14.15v4.25c0 1.094-.787 2-1.864 2.118l-2.005.14M4.75 14.15v4.25c0 1.094.787 2 1.864 2.118l2.005.14M4.75 14.15l2.005-.14M20.25 14.15l-2.005-.14M3.75 9.75h16.5m-16.5 0a2.25 2.25 0 0 1-.895-4.32l1.5-.375m17.145 4.695a2.25 2.25 0 0 0-.895 4.32l-1.5-.375M3.75 9.75v-1.5a2.25 2.25 0 0 1 2.25-2.25h12a2.25 2.25 0 0 1 2.25 2.25v1.5" />
    </svg>
  );
}

export function PublicProfileIconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.385a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

export function PublicProfileIconListBullet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75Zm0 5.25h.008v.008H3.75v-.008Zm0 5.25h.008v.008H3.75V17.25Z" />
    </svg>
  );
}

export function PublicProfileIconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

export function PublicProfileIconBanknote(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M2.25 5.25a60.07 60.07 0 0 0 15.797 2.101c.727.198 1.453-.342 1.453-1.096v-1.036m0-3.102a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096M2.25 5.25v13.5m0-13.5a60.07 60.07 0 0 1 15.797-2.101c.727-.198 1.453.342 1.453 1.096m-17.25 0a60.07 60.07 0 0 0-15.797 2.101c-.727.198-1.453-.342-1.453-1.096" />
    </svg>
  );
}

/** Komisyon / oran (basit % işareti — aynı stroke ailesi) */
export function PublicProfileIconPercent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4.5 19.5 19.5 4.5M9.75 9.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm9 9a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

export function PublicProfileIconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
    </svg>
  );
}

export function PublicProfileIconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function PublicProfileIconArrowPath(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M16.023 9.348h4.992v-4.992m0 4.992-4.804-4.804a4.5 4.5 0 0 0-6.404 0M7.977 14.652h-4.992v4.992m0-4.992 4.804 4.804a4.5 4.5 0 0 0 6.404 0" />
    </svg>
  );
}

export function PublicProfileIconDocumentText(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V16.5a3.75 3.75 0 0 0-3.75-3.75H10.5Z" />
    </svg>
  );
}

export function PublicProfileIconInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M2.25 13.5h3.86a2.25 2.25 0 0 0 2.012-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.218a2.25 2.25 0 0 1 2.013 1.244l.256.512a2.25 2.25 0 0 0 2.012 1.244h3.862M4.5 19.5h15M4.5 4.5h15m-15 0a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25Z" />
    </svg>
  );
}

export function PublicProfileIconChatBubbleLeftRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V4.934c0-1.035-.845-1.898-1.976-1.192a48.624 48.624 0 0 0-8.048 0c-1.131-.706-1.976.157-1.976 1.192v6.286c0 1.035.845 1.898 1.976 1.192a48.624 48.624 0 0 0 8.048 0c1.131.706 1.976-.157 1.976-1.192v-4.286Z" />
    </svg>
  );
}

export function PublicProfileIconLockClosed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

export function PublicProfileIconMagnifyingGlass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function PublicProfileIconPaperAirplane(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

export function PublicProfileIconBuildingOffice2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M2.25 21h19.5m-18-9v3.75m0-12h18v12h-18V3.75m0 12.75h18M6.75 6.75h.008v.008H6.75V6.75Zm0 3h.008v.008H6.75V9.75Zm0 3h.008v.008H6.75V12.75Zm0 3h.008v.008H6.75V15.75Zm3.75-9h.008v.008h-.008V6.75Zm0 3h.008v.008h-.008V9.75Zm0 3h.008v.008h-.008V12.75Zm0 3h.008v.008h-.008V15.75Zm3.75-9h.008v.008H15V6.75Zm0 3h.008v.008H15V9.75Zm0 3h.008v.008H15V12.75Zm0 3h.008v.008H15V15.75Z" />
    </svg>
  );
}

export function PublicProfileIconPhoto(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

export function PublicProfileIconDevicePhoneMobile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

export function PublicProfileIconExclamationTriangle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}
