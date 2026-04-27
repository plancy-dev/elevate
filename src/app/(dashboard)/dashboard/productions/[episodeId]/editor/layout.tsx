/**
 * Editor layout — deliberately empty. The parent dashboard layout still wraps
 * auth + i18n, but the editor page renders as a `fixed inset-0 z-50` overlay
 * so the dashboard sidebar is effectively hidden during editing.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
