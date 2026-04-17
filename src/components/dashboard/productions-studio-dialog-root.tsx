"use client";

import Link from "next/link";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FolderKanban, Radio, Settings2, Wrench } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import {
  StudioProjectCreateForm,
  StudioProjectEditFormWithDelete,
} from "@/components/dashboard/studio-project-forms";
import { StudioDistributionChannelsPanel } from "@/components/dashboard/studio-distribution-channels-panel";
import { StudioIntegrationsProviderTabs } from "@/components/dashboard/studio-integrations-provider-tabs";
import type { StudioProjectRow } from "@/lib/data/studio-projects";
import type { StudioDistributionChannelRow } from "@/lib/studio-productions/shorts-catalog";
import type { StudioOrgProviderConnectionMeta } from "@/lib/data/studio-org-integrations";

export type ProductionsStudioDialogPayload = {
  projects: StudioProjectRow[];
  episodeCountsByProjectId: Record<string, number>;
  locale: string;
  channels: StudioDistributionChannelRow[];
  integrations: {
    organizationId: string | null;
    canEdit: boolean;
    connections: StudioOrgProviderConnectionMeta[];
    encryptionConfigured: boolean;
    serverCallsEnabled: boolean;
    youtubeOAuthEnvConfigured: boolean;
    youtubeChannelTitle: string | null;
  };
};

type ModalKind = "projects" | "channels" | "integrations" | "newProject" | "editProject" | null;

type Ctx = {
  openChannels: () => void;
  openIntegrations: () => void;
  openNewProject: () => void;
  openEditProject: (projectId: string) => void;
  close: () => void;
};

const ProductionsStudioDialogContext = createContext<Ctx | null>(null);

export function useProductionsStudioDialogs(): Ctx {
  const ctx = useContext(ProductionsStudioDialogContext);
  if (!ctx) {
    throw new Error("useProductionsStudioDialogs must be used within ProductionsStudioDialogProvider");
  }
  return ctx;
}

export function ProductionsStudioDialogProvider({
  children,
  payload,
}: {
  children: ReactNode;
  payload: ProductionsStudioDialogPayload;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const setModalKind = useCallback((kind: ModalKind) => {
    setModal(kind);
    if (kind !== "editProject") setEditProjectId(null);
  }, []);

  const close = useCallback(() => {
    setModal(null);
    setEditProjectId(null);
  }, []);

  const openChannels = useCallback(() => setModalKind("channels"), [setModalKind]);
  const openIntegrations = useCallback(() => setModalKind("integrations"), [setModalKind]);
  const openNewProject = useCallback(() => setModalKind("newProject"), [setModalKind]);
  const openEditProject = useCallback(
    (projectId: string) => {
      setEditProjectId(projectId);
      setModal("editProject");
    },
    [],
  );

  const ctx = useMemo(
    () => ({
      openChannels,
      openIntegrations,
      openNewProject,
      openEditProject,
      close,
    }),
    [openChannels, openIntegrations, openNewProject, openEditProject, close],
  );

  const projectForEdit = useMemo(() => {
    if (!editProjectId) return null;
    return payload.projects.find((p) => p.id === editProjectId) ?? null;
  }, [editProjectId, payload.projects]);

  return (
    <ProductionsStudioDialogContext.Provider value={ctx}>
      <Suspense fallback={null}>
        <StudioQueryParamOpener setModalKind={setModalKind} />
      </Suspense>
      {children}
      <ProductionsStudioModals
        modal={modal}
        onClose={close}
        payload={payload}
        projectForEdit={projectForEdit}
      />
    </ProductionsStudioDialogContext.Provider>
  );
}

function StudioQueryParamOpener({
  setModalKind,
}: {
  setModalKind: (kind: ModalKind) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Dashboard.productions");
  const youtubeToastDone = useRef(false);

  useEffect(() => {
    const studio = searchParams.get("studio");
    const youtubeConnected = searchParams.get("youtube_connected");
    const youtubeError = searchParams.get("youtube_error");

    if (studio === "projects") {
      setModalKind("projects");
    } else if (studio === "channels") {
      setModalKind("channels");
    } else if (studio === "integrations") {
      setModalKind("integrations");
    }

    if (!youtubeToastDone.current) {
      if (youtubeConnected === "1") {
        youtubeToastDone.current = true;
        toast.success(t("integrationsYoutubeToastConnected"));
      } else if (youtubeError) {
        youtubeToastDone.current = true;
        toast.error(
          t("integrationsYoutubeToastError", { detail: youtubeError }),
        );
      }
    }

    const shouldStrip =
      studio === "projects" ||
      studio === "channels" ||
      studio === "integrations" ||
      youtubeConnected === "1" ||
      youtubeError != null;

    if (!shouldStrip) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("studio");
    params.delete("youtube_connected");
    params.delete("youtube_error");
    const qs = params.toString();
    router.replace(
      qs ? `/dashboard/productions?${qs}` : "/dashboard/productions",
      { scroll: false },
    );
  }, [searchParams, router, setModalKind, t]);

  return null;
}

function ProductionsStudioModals({
  modal,
  onClose,
  payload,
  projectForEdit,
}: {
  modal: ModalKind;
  onClose: () => void;
  payload: ProductionsStudioDialogPayload;
  projectForEdit: StudioProjectRow | null;
}) {
  const t = useTranslations("Dashboard.productions");
  const int = payload.integrations;

  return (
    <>
      <Modal
        open={modal === "projects"}
        onClose={onClose}
        title={t("projectsMetaTitle")}
        description={t("projectsListSubtitle")}
        size="lg"
      >
        <ProjectsDialogBody payload={payload} onNavigate={onClose} />
      </Modal>

      <Modal
        open={modal === "newProject"}
        onClose={onClose}
        title={t("projectsCtaNew")}
        description={t("projectsListSubtitle")}
        size="lg"
      >
        <StudioProjectCreateForm />
      </Modal>

      <Modal
        open={modal === "editProject" && Boolean(projectForEdit)}
        onClose={onClose}
        title={projectForEdit?.name ?? t("projectsMetaTitle")}
        description={t("projectsListSubtitle")}
        size="lg"
      >
        {projectForEdit ? <StudioProjectEditFormWithDelete project={projectForEdit} /> : null}
      </Modal>

      <Modal
        open={modal === "channels"}
        onClose={onClose}
        title={t("channelsMetaTitle")}
        description={t("channelsPageSubtitle")}
        size="lg"
      >
        <StudioDistributionChannelsPanel
          channels={payload.channels}
          canEdit={int.canEdit}
          encryptionConfigured={int.encryptionConfigured}
          serverCallsEnabled={int.serverCallsEnabled}
          youtubeOAuthEnvConfigured={int.youtubeOAuthEnvConfigured}
          youtubeChannelTitle={int.youtubeChannelTitle}
        />
      </Modal>

      <Modal open={modal === "integrations"} onClose={onClose} title={t("integrationsTitle")} size="xl">
        {!int.organizationId ? (
          <p className="rounded-lg border border-border-subtle bg-layer-01 p-4 text-sm text-text-secondary">
            {t("integrationsNoOrganization")}
          </p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-text-secondary leading-relaxed">{t("integrationsIntro")}</p>
            <StudioIntegrationsProviderTabs
              connections={int.connections}
              canEdit={int.canEdit}
              encryptionConfigured={int.encryptionConfigured}
              serverCallsEnabled={int.serverCallsEnabled}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

function ProjectsDialogBody({
  payload,
  onNavigate,
}: {
  payload: ProductionsStudioDialogPayload;
  onNavigate: () => void;
}) {
  const t = useTranslations("Dashboard.productions");
  const { projects, episodeCountsByProjectId, locale } = payload;

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-text-secondary">{t("projectsListEmpty")}</p>
        <StudioProjectCreateForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="max-h-[40vh] divide-y divide-border-subtle overflow-y-auto rounded-lg border border-border-subtle">
        {projects.map((proj) => {
          const count = episodeCountsByProjectId[proj.id] ?? 0;
          const updated = new Date(proj.updated_at).toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          });
          return (
            <li key={proj.id} className="flex items-start gap-3 px-4 py-3">
              <FolderKanban className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/productions?project=${encodeURIComponent(proj.id)}`}
                  onClick={onNavigate}
                  className="font-semibold text-text-primary hover:text-interactive"
                >
                  {proj.name}
                </Link>
                {proj.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">{proj.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-text-tertiary">
                  {t("projectsEpisodeCount", { count })} · {updated}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Toolbar: 새 프로젝트 + 스튜디오 다이얼로그 트리거 (제작 허브 카드 툴바용). */
export function ProductionsStudioToolbarActions({ className }: { className?: string }) {
  const t = useTranslations("Dashboard.productions");
  const { openChannels, openIntegrations, openNewProject } = useProductionsStudioDialogs();

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 ${className ?? ""}`}
    >
      <Button type="button" variant="tertiary" size="sm" onClick={openNewProject}>
        {t("projectsCtaNew")}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={openChannels} className="gap-1.5">
        <Radio className="h-3.5 w-3.5" aria-hidden />
        {t("channelsNav")}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={openIntegrations} className="gap-1.5">
        <Wrench className="h-3.5 w-3.5" aria-hidden />
        {t("integrationsNav")}
      </Button>
    </div>
  );
}

/** 큐 섹션 헤더: 제목 + 건수 + (프로젝트 스코프 시) 설정. */
export function ProductionsQueueHeadingRow({
  title,
  episodeCount,
  scopedProject,
}: {
  title: string;
  episodeCount: number;
  scopedProject: StudioProjectRow | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <h2
        id="productions-queue-heading"
        className="text-sm font-semibold tracking-tight text-text-primary"
      >
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {episodeCount > 0 ? (
          <span className="rounded-md bg-layer-02 px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
            {episodeCount}
          </span>
        ) : null}
        <ProductionsQueueProjectSettingsButton scopedProject={scopedProject} />
      </div>
    </div>
  );
}

/** 큐 섹션 헤더 우측: 현재 스코프 프로젝트가 있을 때만 설정. */
export function ProductionsQueueProjectSettingsButton({
  scopedProject,
}: {
  scopedProject: StudioProjectRow | null;
}) {
  const t = useTranslations("Dashboard.productions");
  const { openEditProject } = useProductionsStudioDialogs();

  if (!scopedProject) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 gap-1.5 text-text-secondary"
      onClick={() => openEditProject(scopedProject.id)}
      aria-label={t("hubQueueProjectSettingsAria")}
    >
      <Settings2 className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{t("hubQueueProjectSettingsCta")}</span>
    </Button>
  );
}
