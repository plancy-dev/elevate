import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockVenues } from "@/lib/mock/dashboard";

export const metadata = { title: "Venues" };

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Venues</h1>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add venue
        </Button>
      </div>

      <div className="p-6">
        <div className="grid gap-px bg-border-subtle border border-border-subtle md:grid-cols-2 lg:grid-cols-3">
          {mockVenues.map((v) => (
            <div
              key={v.id}
              className="bg-layer-01 p-5 hover:bg-layer-02 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-medium text-text-primary">
                  {v.name}
                </h2>
                <MapPin className="h-4 w-4 text-text-tertiary shrink-0" />
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                {v.city}, {v.country}
              </p>
              <div className="mt-4 flex justify-between text-xs">
                <span className="text-text-tertiary">Capacity</span>
                <span className="text-text-primary font-medium">
                  {v.capacity.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-text-tertiary">Active events</span>
                <span className="text-text-primary font-medium">
                  {v.events}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
