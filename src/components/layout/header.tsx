"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    label: "Product",
    href: "/product",
    children: [
      { href: "/product/event-management", label: "Event Management" },
      { href: "/product/attendee-engagement", label: "Attendee Engagement" },
      { href: "/product/analytics", label: "Analytics & Insights" },
      { href: "/product/ai-concierge", label: "AI Concierge" },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      { href: "/solutions/conferences", label: "Conferences" },
      { href: "/solutions/exhibitions", label: "Exhibitions" },
      { href: "/solutions/incentive-travel", label: "Incentive Travel" },
      { href: "/solutions/corporate-meetings", label: "Corporate Meetings" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-[1584px] items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <ElevateLogo size="sm" />
          </Link>

          <nav className="hidden lg:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 h-12 px-4 text-sm text-text-secondary transition-colors",
                  "hover:text-text-primary hover:bg-layer-02",
                )}
              >
                {link.label}
                {link.children && <ChevronDown className="h-3 w-3" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <ButtonLink href="/contact" variant="ghost" size="sm">
            Contact Sales
          </ButtonLink>
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log In
          </ButtonLink>
          <ButtonLink href="/demo" variant="primary" size="sm">
            Request Demo
          </ButtonLink>
        </div>

        <button
          className="lg:hidden flex h-8 w-8 items-center justify-center text-text-secondary hover:bg-layer-02"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border-subtle bg-surface">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-layer-02"
                  onClick={() => !link.children && setMobileOpen(false)}
                >
                  {link.label}
                  {link.children && <ChevronDown className="h-3 w-3" />}
                </Link>
                {link.children && (
                  <div className="bg-layer-01">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-8 py-2.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-layer-02"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-border-subtle p-4 flex flex-col gap-2">
              <ButtonLink
                href="/contact"
                variant="ghost"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                Contact Sales
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="ghost"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </ButtonLink>
              <ButtonLink
                href="/demo"
                variant="primary"
                size="md"
                className={cn("w-full")}
                onClick={() => setMobileOpen(false)}
              >
                Request Demo
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
