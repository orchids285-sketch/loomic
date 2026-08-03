"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AgentSection } from "@/components/agent-section";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";
import { useAuth } from "@/lib/auth-context";
import {
  ApiAuthError,
  fetchModels,
  fetchWorkspaceSettings,
  updateWorkspaceSettings,
} from "@/lib/server-api";

/**
 * One section, so no tabs.
 *
 * Profile went with the account system -- a display name and an email address are an
 * account, and there is no account here to name. Billing and Usage went with it. What is
 * left is the agent's default model, which is a setting about the work rather than about
 * a person, and a tab bar with one tab in it is furniture pretending to be navigation.
 */
export default function SettingsPage() {
  const { session } = useAuth();

  const [defaultModel, setDefaultModel] = useState<string>("gpt-5.4-mini");
  const [pageLoading, setPageLoading] = useState(true);

  // Ref pattern: prevent token refresh from cascading through dependency arrays
  const accessTokenRef = useRef(session?.access_token);
  accessTokenRef.current = session?.access_token;
  const hasInitialized = useRef(false);

  const getToken = useCallback(() => accessTokenRef.current, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPageLoading(true);

    try {
      const settings = await fetchWorkspaceSettings(token);
      setDefaultModel(settings.settings.defaultModel);
    } catch (err) {
      if (err instanceof ApiAuthError) return;
    } finally {
      setPageLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!session?.access_token) return;
    hasInitialized.current = true;
    loadData();
  }, [session?.access_token, loadData]);

  const handleAgentSave = useCallback(
    async (model: string) => {
      const token = getToken();
      if (!token) return;
      const result = await updateWorkspaceSettings(token, {
        defaultModel: model,
      });
      setDefaultModel(result.settings.defaultModel);
    },
    [getToken],
  );

  const stableFetchModels = useCallback(() => fetchModels(), []);

  if (pageLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8">
      <h1 className="mb-4 text-base font-semibold sm:mb-6 sm:text-lg">
        Settings
      </h1>

      <div className="max-w-xl">
        <AgentSection
          defaultModel={defaultModel}
          onSave={handleAgentSave}
          fetchModels={stableFetchModels}
        />
      </div>
    </div>
  );
}
