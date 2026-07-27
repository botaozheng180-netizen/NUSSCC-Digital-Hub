"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ClubLogo } from "./club-logo";
import { Icon } from "./icons";

const navigation = [
  ["/", "Dashboard", "dashboard"],
  ["/events", "Events", "megaphone"],
  ["/calendar", "Calendar", "calendar"],
  ["/tasks", "My Tasks", "tasks"],
  ["/trek", "Semiconductor Trek", "trek"],
  ["/achievements", "Achievements", "trophy"],
  ["/profile", "My Profile", "user"],
  ["/settings", "Settings", "settings"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <ClubLogo className="brand-mark" />
          <div className="brand-name">
            <strong>NUS</strong>
            <strong>SEMICONDUCTOR</strong>
            <span>
              CLUB <b>Digital Hub</b>
            </span>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {navigation.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={path === href ? "active" : ""}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="shield" size={18} />
          <div>
            <strong>Built for members</strong>
            <span>One hub. One journey.</span>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Open navigation"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
          <div className="mobile-brand">
            NUS SEMICONDUCTOR CLUB <span>Digital Hub</span>
          </div>
          <div className="phase-pill">
            <span /> Phase 3 Database Implementation
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <span>© 2026 NUS Semiconductor Club</span>
          <span>Built to grow with every committee.</span>
        </footer>
      </div>
    </div>
  );
}
