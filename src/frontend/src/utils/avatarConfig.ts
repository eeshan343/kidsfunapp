import type { AvatarConfig } from "../hooks/useQueries";

export function getDefaultAvatarConfig(): AvatarConfig {
  return {
    body: "body1",
    head: "head1",
    hair: "hair1",
    pants: "pants1",
    headwear: "none",
    shoes: "shoes1",
  };
}

export function mergeAvatarConfig(
  userConfig: AvatarConfig | undefined | null,
): AvatarConfig {
  const defaultConfig = getDefaultAvatarConfig();

  if (!userConfig) {
    return defaultConfig;
  }

  return {
    body: userConfig.body || defaultConfig.body,
    head: userConfig.head || defaultConfig.head,
    hair: userConfig.hair || defaultConfig.hair,
    pants: userConfig.pants || defaultConfig.pants,
    headwear: userConfig.headwear || defaultConfig.headwear,
    shoes: userConfig.shoes || defaultConfig.shoes,
  };
}
