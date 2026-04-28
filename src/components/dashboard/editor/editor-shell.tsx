"use client";

import {
  EditorStoreProvider,
  type EditorDslV3,
} from "@/components/dashboard/editor/store";
import { EditorHeader } from "@/components/dashboard/editor/editor-header";
import { PreviewPane } from "@/components/dashboard/editor/preview-pane";
import { Timeline } from "@/components/dashboard/editor/timeline/timeline";
import { InspectorPanel } from "@/components/dashboard/editor/inspector/inspector-panel";
import { EditorExportButton } from "@/components/dashboard/editor/export-button";
import { useEditorAutosave } from "@/components/dashboard/editor/use-editor-autosave";

type Props = {
  episodeId: string;
  episodeTitle: string;
  initialDsl: EditorDslV3;
};

export function EditorShell(props: Props) {
  return (
    <EditorStoreProvider initialDsl={props.initialDsl}>
      <EditorShellInner {...props} />
    </EditorStoreProvider>
  );
}

function EditorShellInner({ episodeId, episodeTitle }: Props) {
  useEditorAutosave(episodeId);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-paper-50 text-ink-900"
      data-editor-shell
    >
      <EditorHeader episodeId={episodeId} episodeTitle={episodeTitle} />
      <main className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center bg-paper-100 p-4">
            <PreviewPane />
          </div>
          <div className="border-t border-ink-100 bg-paper-50">
            <Timeline />
          </div>
        </section>
        <aside className="w-[320px] shrink-0 border-l border-ink-100 bg-paper-100">
          <InspectorPanel />
        </aside>
      </main>
      <footer className="flex items-center justify-between border-t border-ink-100 bg-paper-100 px-4 py-2">
        <span className="font-mono text-[11px] text-ink-500">
          {/* Preview accuracy disclaimer — kept in a plain span so the preview
              pane doesn't have to pipe i18n through its render loop. */}
          <span data-i18n="previewApproximateHint" />
        </span>
        <EditorExportButton episodeId={episodeId} />
      </footer>
    </div>
  );
}
