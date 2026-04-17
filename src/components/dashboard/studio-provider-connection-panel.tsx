"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Copy, Eye, EyeOff } from "lucide-react";
import {
  deleteStudioProviderConnection,
  revealStudioProviderSecret,
  saveStudioProviderSecret,
  testStudioProviderIntegration,
  type StudioOrgIntegrationActionState,
} from "@/actions/studio-org-integrations";
import type { StudioOrgProviderConnectionMeta } from "@/lib/data/studio-org-integrations";
import { STUDIO_PROVIDER_KEY_SOURCES } from "@/lib/studio-integrations/provider-key-sources";
import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { toast } from "@/lib/ui/app-toast";
import { Button } from "@/components/ui/button";

const initialState: StudioOrgIntegrationActionState = undefined;

type ProviderLeaf =
  | "title"
  | "intro"
  | "placeholder"
  | "keySourceHint"
  | "keySourcePrimaryLabel"
  | "keySourceSecondaryLabel";

function providerMsg(
  t: ReturnType<typeof useTranslations>,
  providerId: StudioIntegrationProviderId,
  leaf: ProviderLeaf,
): string {
  return t(`integrationsProvider.${providerId}.${leaf}` as never);
}

export function StudioProviderConnectionPanel({
  providerId,
  connectionMeta,
  canEdit,
  encryptionConfigured,
  serverCallsEnabled,
}: {
  providerId: StudioIntegrationProviderId;
  connectionMeta: StudioOrgProviderConnectionMeta | null;
  canEdit: boolean;
  encryptionConfigured: boolean;
  serverCallsEnabled: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const formatter = useFormatter();

  const [saveState, saveAction, savePending] = useActionState(
    saveStudioProviderSecret,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudioProviderConnection,
    initialState,
  );
  const [testState, testAction, testPending] = useActionState(
    testStudioProviderIntegration,
    initialState,
  );

  const [secretValue, setSecretValue] = useState("");
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [revealPending, setRevealPending] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const prevSave = useRef(false);
  const prevTest = useRef(false);
  const prevDelete = useRef(false);

  const hasSavedKey = Boolean(connectionMeta);
  const lastVerified =
    connectionMeta?.last_verified_at != null
      ? formatter.dateTime(new Date(connectionMeta.last_verified_at), {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  const saveDisabled = !canEdit || !encryptionConfigured;
  const testDisabled =
    !canEdit ||
    !serverCallsEnabled ||
    !encryptionConfigured ||
    !hasSavedKey;
  const removeDisabled = !canEdit || !hasSavedKey;

  const fieldId = `studio-provider-secret-${providerId}`;
  const keyUrls = STUDIO_PROVIDER_KEY_SOURCES[providerId];

  useEffect(() => {
    if (!hasSavedKey) {
      setSecretValue("");
      setRevealError(null);
      setShowPlaintext(false);
    }
  }, [hasSavedKey]);

  useEffect(() => {
    if (deleteState?.success === "deleted") {
      setSecretValue("");
      setRevealError(null);
      setShowPlaintext(false);
    }
  }, [deleteState?.success]);

  useEffect(() => {
    const done =
      prevSave.current && !savePending && saveState?.success === "saved";
    prevSave.current = savePending;
    if (done) toast.success(t("integrationsToastSaved"));
  }, [savePending, saveState?.success, t]);

  useEffect(() => {
    const done =
      prevTest.current && !testPending && testState?.success === "testOk";
    prevTest.current = testPending;
    if (done) toast.success(t("integrationsToastTestOk"));
  }, [testPending, testState?.success, t]);

  useEffect(() => {
    const done =
      prevDelete.current && !deletePending && deleteState?.success === "deleted";
    prevDelete.current = deletePending;
    if (done) toast.success(t("integrationsToastDeleted"));
  }, [deletePending, deleteState?.success, t]);

  async function handleRevealStored() {
    setRevealError(null);
    setRevealPending(true);
    try {
      const result = await revealStudioProviderSecret(providerId);
      if (result.ok) {
        setSecretValue(result.secret);
        setShowPlaintext(false);
      } else {
        setRevealError(result.error);
      }
    } finally {
      setRevealPending(false);
    }
  }

  function handleHideStored() {
    setSecretValue("");
    setRevealError(null);
    setShowPlaintext(false);
  }

  async function handleCopySecret() {
    if (!secretValue) return;
    try {
      await navigator.clipboard.writeText(secretValue);
      toast.success(t("integrationsCopiedToast"));
    } catch {
      /* ignore */
    }
  }

  const inputPlaceholder = hasSavedKey
    ? t("integrationsKeyPlaceholderStored")
    : providerMsg(t, providerId, "placeholder");

  return (
    <section className="rounded-2xl border border-border-subtle/90 bg-layer-01 p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {providerMsg(t, providerId, "title")}
        </h2>
        <p className="mt-1 text-sm text-text-tertiary leading-relaxed">
          {providerMsg(t, providerId, "intro")}
        </p>
      </div>

      {providerId === "youtube_data" ? (
        <p className="rounded-lg border border-border-subtle/80 bg-layer-02/35 px-4 py-3 text-xs text-text-tertiary leading-relaxed">
          {t("integrationsYoutubeDataUploadHint")}
        </p>
      ) : null}

      <div className="rounded-lg border border-border-subtle/80 bg-layer-02/35 px-4 py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t("integrationsKeySourceHeading")}
        </p>
        <p className="text-xs text-text-tertiary leading-relaxed">
          {providerMsg(t, providerId, "keySourceHint")}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <a
            href={keyUrls.primary}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-interactive underline underline-offset-2 hover:opacity-90"
          >
            {providerMsg(t, providerId, "keySourcePrimaryLabel")}
          </a>
          {keyUrls.secondary ? (
            <a
              href={keyUrls.secondary}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-interactive underline underline-offset-2 hover:opacity-90"
            >
              {providerMsg(t, providerId, "keySourceSecondaryLabel")}
            </a>
          ) : null}
        </div>
      </div>

      {!encryptionConfigured ? (
        <p
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100/95"
          role="status"
        >
          {t("integrationsEncryptionOff")}
        </p>
      ) : null}

      {!serverCallsEnabled ? (
        <p
          className="rounded-md border border-border-subtle bg-layer-02/50 px-3 py-2 text-xs text-text-secondary leading-relaxed"
          role="status"
        >
          {t("integrationsServerCallsOff")}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="text-sm text-text-secondary">
          {t("integrationsReadOnlyEditors")}
        </p>
      ) : null}

      {hasSavedKey ? (
        <div className="text-sm text-text-secondary space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                lastVerified
                  ? "inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200/95"
                  : "inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100/90"
              }
            >
              {lastVerified
                ? t("integrationsBadgeVerified")
                : t("integrationsBadgeUnverified")}
            </span>
            <p className="text-sm">{t("integrationsKeySavedStatus")}</p>
          </div>
          {lastVerified ? (
            <p className="text-xs text-text-tertiary">
              {t("integrationsLastVerified", { date: lastVerified })}
            </p>
          ) : (
            <div className="text-xs text-text-tertiary space-y-1">
              <p>{t("integrationsNeverVerified")}</p>
              {serverCallsEnabled ? (
                <p>{t("integrationsRunConnectionTestHint")}</p>
              ) : (
                <p>{t("integrationsUnverifiedNeedServerFlag")}</p>
              )}
            </div>
          )}
          {keyUrls.billing ? (
            <div className="rounded-lg border border-border-subtle/80 bg-layer-02/35 px-3 py-2 space-y-1.5">
              <p className="text-xs text-text-tertiary leading-relaxed">
                {t("integrationsBillingCreditNote")}
              </p>
              <a
                href={keyUrls.billing}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-medium text-interactive underline underline-offset-2 hover:opacity-90"
              >
                {t("integrationsBillingLink")}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {canEdit ? (
        <form action={saveAction} className="space-y-4 max-w-xl">
          {saveState?.error ? (
            <p
              className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
              role="alert"
            >
              {translateActionErrorMessage(saveState.error, tAction)}
            </p>
          ) : null}
          {hasSavedKey ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">
                {t("integrationsStoredKeyLabel")}
              </p>
              {secretValue === "" ? (
                <p
                  className="font-mono text-sm tracking-[0.2em] text-text-primary select-none rounded-lg border border-border-subtle bg-field px-3 py-2.5"
                  aria-hidden
                >
                  {t("integrationsStoredKeyMasked")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={
                    !encryptionConfigured || revealPending || !hasSavedKey
                  }
                  isLoading={revealPending}
                  onClick={() => void handleRevealStored()}
                >
                  {t("integrationsRevealStoredKey")}
                </Button>
                {secretValue !== "" ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleHideStored}
                    >
                      {t("integrationsHideStoredKey")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleCopySecret()}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t("integrationsCopyStoredKey")}
                    </Button>
                  </>
                ) : null}
              </div>
              {revealError ? (
                <p className="text-xs text-danger" role="alert">
                  {translateActionErrorMessage(revealError, tAction)}
                </p>
              ) : null}
              <p className="text-xs text-text-tertiary leading-relaxed">
                {t("integrationsRevealSensitiveHint")}
              </p>
            </div>
          ) : null}
          <div>
            <label
              htmlFor={fieldId}
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              {t("integrationsFieldApiKey")}
            </label>
            <div className="relative">
              <input
                id={fieldId}
                name="secret"
                type={showPlaintext ? "text" : "password"}
                autoComplete="off"
                maxLength={8192}
                value={secretValue}
                onChange={(e) => {
                  setSecretValue(e.target.value);
                  setRevealError(null);
                }}
                placeholder={inputPlaceholder}
                disabled={!encryptionConfigured}
                className="h-10 w-full rounded-lg border border-border-subtle bg-field pl-3 pr-10 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 disabled:opacity-60"
              />
              {secretValue !== "" ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-secondary hover:bg-surface-03 hover:text-text-primary"
                  onClick={() => setShowPlaintext((v) => !v)}
                  aria-label={
                    showPlaintext
                      ? t("integrationsMaskSecretAria")
                      : t("integrationsShowSecretAria")
                  }
                >
                  {showPlaintext ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              ) : null}
            </div>
            <input type="hidden" name="provider" value={providerId} />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={savePending}
            disabled={saveDisabled}
          >
            {t("integrationsActionSave")}
          </Button>
        </form>
      ) : null}

      {canEdit ? (
        <div className="space-y-5 pt-4 border-t border-border-subtle">
          <form action={testAction} className="space-y-2 max-w-xl">
            <input type="hidden" name="provider" value={providerId} />
            {testState?.error ? (
              <p
                className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
                role="alert"
              >
                {translateActionErrorMessage(testState.error, tAction)}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={testPending}
              disabled={testDisabled}
            >
              {t("integrationsActionTest")}
            </Button>
          </form>

          <form action={deleteAction} className="space-y-2 max-w-xl">
            <input type="hidden" name="provider" value={providerId} />
            {deleteState?.error ? (
              <p
                className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
                role="alert"
              >
                {translateActionErrorMessage(deleteState.error, tAction)}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={deletePending}
              disabled={removeDisabled}
            >
              {t("integrationsActionRemove")}
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
