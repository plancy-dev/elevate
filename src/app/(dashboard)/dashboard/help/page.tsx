import Link from "next/link";
import { BookOpen, Mail, MessageCircle } from "lucide-react";

export const metadata = { title: "Help & Support" };

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Help & Support</h1>
      </div>

      <div className="p-6 max-w-lg space-y-4">
        <Link
          href="https://docs.elevate.example"
          className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4 hover:bg-layer-02 transition-colors"
        >
          <BookOpen className="h-5 w-5 text-text-tertiary" />
          <div>
            <div className="text-sm font-medium text-text-primary">
              Documentation
            </div>
            <div className="text-xs text-text-tertiary">
              Guides and API reference (placeholder URL)
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4">
          <Mail className="h-5 w-5 text-text-tertiary" />
          <div>
            <div className="text-sm font-medium text-text-primary">Email</div>
            <div className="text-xs text-text-tertiary">support@elevate.example</div>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4">
          <MessageCircle className="h-5 w-5 text-text-tertiary" />
          <div>
            <div className="text-sm font-medium text-text-primary">Chat</div>
            <div className="text-xs text-text-tertiary">
              Enterprise: dedicated Slack channel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
