import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { useEffect, useMemo, useRef, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

interface UseActorResult {
  actor: backendInterface | null;
  isFetching: boolean;
}

function getCanisterId(): string {
  // Runtime-injected env (from env.json loaded by main.tsx or vite)
  const w = window as Window &
    typeof globalThis & { ENV?: Record<string, string> };
  if (w.ENV?.backend_canister_id && w.ENV.backend_canister_id !== "undefined") {
    return w.ENV.backend_canister_id;
  }
  // Vite env variable fallback
  const viteId = (import.meta as ImportMeta & { env: Record<string, string> })
    .env?.CANISTER_ID_BACKEND;
  if (viteId && viteId !== "undefined") return viteId;
  return "";
}

async function fetchEnvCanisterId(): Promise<string> {
  try {
    const res = await fetch("/env.json");
    if (!res.ok) return "";
    const data = (await res.json()) as Record<string, string>;
    return data.backend_canister_id && data.backend_canister_id !== "undefined"
      ? data.backend_canister_id
      : "";
  } catch {
    return "";
  }
}

const noopUpload = async (_file: ExternalBlob): Promise<Uint8Array> =>
  new Uint8Array();
const noopDownload = async (_bytes: Uint8Array): Promise<ExternalBlob> =>
  ExternalBlob.fromBytes(new Uint8Array());

export function useActor(): UseActorResult {
  const [canisterId, setCanisterId] = useState<string>(() => getCanisterId());
  const [isFetching, setIsFetching] = useState<boolean>(!canisterId);
  const resolvedRef = useRef(false);
  const { identity } = useInternetIdentity();

  useEffect(() => {
    if (canisterId || resolvedRef.current) return;
    resolvedRef.current = true;
    setIsFetching(true);
    fetchEnvCanisterId().then((id) => {
      setCanisterId(id);
      setIsFetching(false);
    });
  }, [canisterId]);

  const actor = useMemo<backendInterface | null>(() => {
    if (!canisterId) return null;
    const agent = HttpAgent.createSync({
      host: window.location.origin,
      identity: identity as Identity | undefined,
    });
    return createActor(canisterId, noopUpload, noopDownload, { agent });
  }, [canisterId, identity]);

  return { actor, isFetching };
}
