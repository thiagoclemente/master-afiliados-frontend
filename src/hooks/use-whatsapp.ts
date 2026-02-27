"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  WhatsAppAccount,
  WhatsAppCampaign,
  WhatsAppCampaignPreview,
  WhatsAppGroup,
} from "@/interfaces/whatsapp";
import {
  connectWhatsappSession,
  disconnectWhatsappSession,
  fetchWhatsappConnections,
  fetchWhatsappGroups,
  previewWhatsappCampaign,
  scheduleWhatsappCampaign,
  setDefaultWhatsappGroup,
  syncWhatsappSession,
} from "@/services/whatsapp.service";
import {
  fetchUserSubscriptions,
  hasPromoterSubscription,
} from "@/services/user-subscription.service";
const PREVIEW_CACHE_KEY = "whatsappPreviewCache";

function loadPreviewCache(): Record<string, WhatsAppCampaignPreview> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(PREVIEW_CACHE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed) return {};

    const normalized: Record<string, WhatsAppCampaignPreview> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (
          value &&
          typeof value === "object" &&
          "message" in value &&
          "payload" in value
        ) {
          normalized[key] = {
            message: String(
              (value as Record<string, unknown>).message ?? ""
            ),
            payload:
              ((value as Record<string, unknown>).payload as Record<
                string,
                unknown
              >) ?? {},
          };
        }
      }
    );
    return normalized;
  } catch (error) {
    console.error("Erro ao carregar cache de preview do WhatsApp", error);
    return {};
  }
}

function persistPreviewCache(cache: Record<string, WhatsAppCampaignPreview>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Erro ao salvar cache de preview do WhatsApp", error);
  }
}

export function useWhatsApp() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<WhatsAppAccount | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewCacheRef = useRef<Record<string, WhatsAppCampaignPreview>>(
    loadPreviewCache()
  );

  const ensureAccess = useCallback(async () => {
    if (hasAccess !== null) {
      return hasAccess;
    }

    try {
      const response = await fetchUserSubscriptions();
      const subscriptions = response.data || [];
      const allowed = hasPromoterSubscription(subscriptions);
      setHasAccess(allowed);
      return allowed;
    } catch (err) {
      console.error("Erro ao verificar assinatura do WhatsApp", err);
      setHasAccess(false);
      return false;
    }
  }, [hasAccess]);

  const requireAccess = useCallback(async () => {
    const allowed = await ensureAccess();
    if (!allowed) {
      const message =
        "Disponível apenas para assinantes Master Premium ou Divulgador Master.";
      setError(message);
      throw new Error(message);
    }
  }, [ensureAccess]);

  const startStatusPolling = useCallback(
    (sessionName: string) => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }

      statusIntervalRef.current = setInterval(async () => {
        try {
          const updatedConnections = await fetchWhatsappConnections();
          setAccounts(updatedConnections);

          const updated = updatedConnections.find(
            (account) => account.sessionName === sessionName
          );
          if (!updated) return;

          setSelectedAccount(updated);

          if (updated.statusConnection === "connected") {
            const fetchedGroups = await fetchWhatsappGroups(sessionName);
            setGroups(fetchedGroups);
            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
            }
          }
        } catch (err) {
          console.error("Erro ao atualizar status do WhatsApp", err);
        }
      }, 5000);
    },
    [setAccounts]
  );

  const loadConnections = useCallback(
    async (opts?: { skipGroups?: boolean }) => {
      setError(null);
      await requireAccess();

      setIsLoading(true);

      try {
        const connections = await fetchWhatsappConnections();
        setAccounts(connections);

        const nextSelected =
          (selectedAccount &&
            connections.find(
              (account) =>
                account.sessionName === selectedAccount.sessionName
            )) ||
          connections[0] ||
          null;

        setSelectedAccount(nextSelected ?? null);

        if (opts?.skipGroups) {
          return connections;
        }

        if (nextSelected?.statusConnection === "connected") {
          const fetchedGroups = await fetchWhatsappGroups(
            nextSelected.sessionName
          );
          setGroups(fetchedGroups);
        } else if (nextSelected?.statusConnection === "pending") {
          setGroups([]);
          startStatusPolling(nextSelected.sessionName);
        } else {
          setGroups([]);
        }

        return connections;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao carregar conexões do WhatsApp.";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [requireAccess, selectedAccount, startStatusPolling]
  );

  const connectAccount = useCallback(
    async (sessionName: string) => {
      setError(null);
      await requireAccess();

      setIsLoading(true);

      try {
        const account = await connectWhatsappSession(
          sessionName.trim(),
          sessionName.trim()
        );

        if (account) {
          setAccounts((prev) => {
            const filtered = prev.filter(
              (item) => item.sessionName !== account.sessionName
            );
            return [...filtered, account];
          });
          setSelectedAccount(account);
          setGroups([]);

          if (account.statusConnection === "connected") {
            const fetchedGroups = await fetchWhatsappGroups(
              account.sessionName
            );
            setGroups(fetchedGroups);
          } else {
            startStatusPolling(account.sessionName);
          }
        }

        return account;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Não foi possível criar a conexão do WhatsApp.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requireAccess, startStatusPolling]
  );

  const selectAccount = useCallback(
    async (sessionName: string) => {
      const account =
        accounts.find((item) => item.sessionName === sessionName) ?? null;
      setSelectedAccount(account);
      setError(null);

      if (!account) {
        setGroups([]);
        return null;
      }

      if (account.statusConnection === "connected") {
        setIsGroupsLoading(true);
        try {
          const fetchedGroups = await fetchWhatsappGroups(sessionName);
          setGroups(fetchedGroups);
        } finally {
          setIsGroupsLoading(false);
        }
      } else if (account.statusConnection === "pending") {
        setGroups([]);
        startStatusPolling(sessionName);
      } else {
        setGroups([]);
      }

      return account;
    },
    [accounts, startStatusPolling]
  );

  const syncAccount = useCallback(async () => {
    if (!selectedAccount) {
      throw new Error("Selecione uma conta do WhatsApp.");
    }

    await requireAccess();
    setIsLoading(true);
    setError(null);

    try {
      const synced = await syncWhatsappSession(selectedAccount.sessionName);

      if (synced) {
        setAccounts((prev) => {
          const filtered = prev.filter(
            (item) => item.sessionName !== synced.sessionName
          );
          return [...filtered, synced];
        });
        setSelectedAccount(synced);

        if (synced.statusConnection === "connected") {
          const fetchedGroups = await fetchWhatsappGroups(
            synced.sessionName
          );
          setGroups(fetchedGroups);
        }
      }

      return synced;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao sincronizar status do WhatsApp.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requireAccess, selectedAccount]);

  const refreshGroups = useCallback(
    async (forceRefresh = false) => {
      if (!selectedAccount) {
        throw new Error("Selecione uma conta do WhatsApp.");
      }

      await requireAccess();
      setIsGroupsLoading(true);
      setError(null);

      try {
        const fetchedGroups = await fetchWhatsappGroups(
          selectedAccount.sessionName,
          forceRefresh
        );
        setGroups(fetchedGroups);
        return fetchedGroups;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao carregar grupos do WhatsApp.";
        setError(message);
        throw err;
      } finally {
        setIsGroupsLoading(false);
      }
    },
    [requireAccess, selectedAccount]
  );

  const defineDefaultGroup = useCallback(
    async (group: WhatsAppGroup) => {
      if (!selectedAccount) {
        throw new Error("Selecione uma conta do WhatsApp.");
      }

      await requireAccess();
      setIsLoading(true);
      setError(null);

      try {
        const updated = await setDefaultWhatsappGroup({
          groupId: group.id,
          groupName: group.name ?? group.id,
          sessionName: selectedAccount.sessionName,
        });

        if (updated) {
          setAccounts((prev) => {
            const filtered = prev.filter(
              (item) => item.sessionName !== updated.sessionName
            );
            return [...filtered, updated];
          });
          setSelectedAccount(updated);
        }

        return updated;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao definir grupo padrão.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requireAccess, selectedAccount]
  );

  const generatePreview = useCallback(
    async (
      videoDocumentId: string,
      opts?: { forceRefresh?: boolean; message?: string }
    ): Promise<WhatsAppCampaignPreview> => {
      await requireAccess();

      if (
        !opts?.forceRefresh &&
        previewCacheRef.current[videoDocumentId] &&
        previewCacheRef.current[videoDocumentId].message
      ) {
        return previewCacheRef.current[videoDocumentId];
      }

      try {
        const preview = await previewWhatsappCampaign(
          videoDocumentId,
          opts?.message
        );
        const normalized: WhatsAppCampaignPreview = {
          message: preview?.message ?? "",
          payload: preview?.payload ?? {},
        };

        previewCacheRef.current[videoDocumentId] = normalized;
        persistPreviewCache(previewCacheRef.current);
        return normalized;
      } catch (err) {
        const fallback: WhatsAppCampaignPreview = {
          message:
            "Erro ao gerar preview da campanha. Verifique o link do produto e tente novamente.",
          payload: {},
        };
        previewCacheRef.current[videoDocumentId] = fallback;
        persistPreviewCache(previewCacheRef.current);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao gerar preview da campanha do WhatsApp."
        );
        return fallback;
      }
    },
    [requireAccess]
  );

  const sendCampaign = useCallback(
    async (params: {
      videoDocumentId?: string;
      link?: string;
      groupId: string;
      groupName: string;
      message: string;
      sendNow: boolean;
      scheduledAt?: Date;
      previewPayload?: Record<string, unknown>;
    }): Promise<WhatsAppCampaign | null> => {
      if (!selectedAccount) {
        throw new Error("Nenhuma conta do WhatsApp selecionada.");
      }

      await requireAccess();
      setIsSending(true);
      setError(null);

      try {
        const scheduledAtIso =
          !params.sendNow && params.scheduledAt
            ? params.scheduledAt.toISOString()
            : undefined;

        const result = await scheduleWhatsappCampaign({
          videoDocumentId: params.videoDocumentId,
          link: params.link,
          groupId: params.groupId,
          groupName: params.groupName,
          message: params.message,
          sendType: params.sendNow ? "immediate" : "scheduled",
          sessionName: selectedAccount.sessionName,
          scheduledAt: scheduledAtIso,
          previewPayload: params.previewPayload,
        });

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao agendar disparo no WhatsApp.";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [requireAccess, selectedAccount]
  );

  const disconnect = useCallback(async () => {
    if (!selectedAccount) return;

    await requireAccess();
    setIsLoading(true);
    setError(null);

    try {
      await disconnectWhatsappSession(selectedAccount.sessionName);
      setAccounts((prev) =>
        prev.filter((item) => item.sessionName !== selectedAccount.sessionName)
      );
      setGroups([]);

      setSelectedAccount((prev) => {
        const remaining = accounts.filter(
          (item) => item.sessionName !== prev?.sessionName
        );
        return remaining[0] ?? null;
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao desconectar conta do WhatsApp.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accounts, requireAccess, selectedAccount]);

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  return {
    accounts,
    selectedAccount,
    groups,
    hasAccess,
    isLoading,
    isGroupsLoading,
    isSending,
    error,
    loadConnections,
    connectAccount,
    selectAccount,
    syncAccount,
    refreshGroups,
    defineDefaultGroup,
    generatePreview,
    sendCampaign,
    disconnect,
  };
}
