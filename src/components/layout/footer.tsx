import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";

const footerLinks = {
  Product: [
    { href: "/product/event-management", label: "Event Management" },
    { href: "/product/attendee-engagement", label: "Attendee Engagement" },
    { href: "/product/analytics", label: "Analytics & Insights" },
    { href: "/product/ai-concierge", label: "AI Concierge" },
  ],
  Solutions: [
    { href: "/solutions/conferences", label: "Conferences" },
    { href: "/solutions/exhibitions", label: "Exhibitions" },
    { href: "/solutions/incentive-travel", label: "Incentive Travel" },
    { href: "/solutions/corporate-meetings", label: "Corporate Meetings" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/careers", label: "Careers" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact Sales" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/security", label: "Security" },
    { href: "/compliance", label: "Compliance" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-[1584px] px-4 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <ElevateLogo size="sm" />
            <p className="mt-4 text-xs text-text-tertiary leading-relaxed max-w-[200px]">
              The enterprise platform for MICE event management. Powering
              conferences, exhibitions, and corporate meetings worldwide.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border-subtle pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Elevate Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-tertiary">SOC 2 Compliant</span>
            <span className="text-xs text-text-tertiary">GDPR Ready</span>
            <span className="text-xs text-text-tertiary">ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
