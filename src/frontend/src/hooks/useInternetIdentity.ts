import { useInternetIdentity as useCoreInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Identity } from "@dfinity/agent";
import { useMemo } from "react";

export interface InternetIdentityState {
  isAuthenticated: boolean;
  principal: string | null;
  identity: Identity | null;
  login: () => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useInternetIdentity(): InternetIdentityState {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
  } = useCoreInternetIdentity();

  const principal = useMemo(() => {
    if (!identity) return null;
    try {
      return identity.getPrincipal().toText();
    } catch {
      return null;
    }
  }, [identity]);

  const logout = async () => {
    clear();
  };

  return {
    isAuthenticated,
    principal,
    identity: identity ?? null,
    login,
    logout,
    isLoading: isInitializing || isLoggingIn,
  };
}
