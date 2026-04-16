"use client";

import type { ReactNode } from "react";
import {
  ProductionsStudioDialogProvider,
  type ProductionsStudioDialogPayload,
} from "@/components/dashboard/productions-studio-dialog-root";

/**
 * Client boundary: studio dialogs + `useSearchParams` deep-link (`?studio=`).
 * Wrap with `<Suspense>` from the server page.
 */
export function ProductionsHubWithDialogs({
  payload,
  children,
}: {
  payload: ProductionsStudioDialogPayload;
  children: ReactNode;
}) {
  return (
    <ProductionsStudioDialogProvider payload={payload}>{children}</ProductionsStudioDialogProvider>
  );
}
