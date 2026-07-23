import type { AvatarConfig } from "../../hooks/useQueries";

interface VariantStyle {
  color: string;
  size: [number, number, number];
  type?: string;
}

interface AvatarVariants {
  body: VariantStyle;
  head: VariantStyle;
  hair: VariantStyle;
  pants: VariantStyle;
  headwear: VariantStyle;
  shoes: VariantStyle;
}

export function getAvatarVariants(config: AvatarConfig): AvatarVariants {
  return {
    body: getBodyVariant(config.body),
    head: getHeadVariant(config.head),
    hair: getHairVariant(config.hair),
    pants: getPantsVariant(config.pants),
    headwear: getHeadwearVariant(config.headwear),
    shoes: getShoesVariant(config.shoes),
  };
}

function getBodyVariant(body: string): VariantStyle {
  const variants: Record<string, VariantStyle> = {
    body1: { color: "#FF6B6B", size: [0.7, 0.8, 0.4] },
    body2: { color: "#4ECDC4", size: [0.7, 0.8, 0.4] },
    body3: { color: "#FFE66D", size: [0.7, 0.8, 0.4] },
    body4: { color: "#95E1D3", size: [0.7, 0.8, 0.4] },
    body5: { color: "#A8E6CF", size: [0.7, 0.8, 0.4] },
    body6: { color: "#FF8B94", size: [0.7, 0.8, 0.4] },
    body7: { color: "#C7CEEA", size: [0.7, 0.8, 0.4] },
    body8: { color: "#FFDAC1", size: [0.7, 0.8, 0.4] },
  };
  return variants[body] || variants.body1;
}

function getHeadVariant(head: string): VariantStyle {
  const variants: Record<string, VariantStyle> = {
    head1: { color: "#FFD1A4", size: [0.6, 0.6, 0.5] },
    head2: { color: "#F4C2A0", size: [0.65, 0.65, 0.55] },
    head3: { color: "#D4A574", size: [0.6, 0.6, 0.5] },
    head4: { color: "#8D5524", size: [0.6, 0.6, 0.5] },
    head5: { color: "#FFDBAC", size: [0.6, 0.6, 0.5] },
    head6: { color: "#E0AC69", size: [0.6, 0.6, 0.5] },
    head7: { color: "#C68642", size: [0.6, 0.6, 0.5] },
    head8: { color: "#A67C52", size: [0.6, 0.6, 0.5] },
  };
  return variants[head] || variants.head1;
}

function getHairVariant(hair: string): VariantStyle {
  // size = [width, height, depth] in head-relative units.
  // 'top' = cap of hair on top of head (wide, short, shallow dome)
  // 'full' = rounded full head of hair (wide, medium, deep)
  // 'curly' = voluminous rounded shape (medium, tall, deep)
  // 'spiky' = taller jagged shape (narrow, tall, shallow)
  // 'long' = extends down the sides/back (wide, very tall, deep)
  // 'mohawk' = tall narrow strip (very narrow, very tall, shallow)
  // 'ponytail' = cap of hair with a back tail (wide, medium, deep)
  // 'none' = bald (no geometry)
  const variants: Record<string, VariantStyle> = {
    hair1: { color: "#3D2817", size: [0.65, 0.2, 0.55], type: "top" },
    hair2: { color: "#6B4226", size: [0.72, 0.35, 0.62], type: "full" },
    hair3: { color: "#1F1410", size: [0.5, 0.5, 0.5], type: "curly" },
    hair4: { color: "#D2691E", size: [0.4, 0.6, 0.4], type: "spiky" },
    hair5: { color: "#B0B0B0", size: [0.68, 0.9, 0.6], type: "long" },
    hair6: { color: "#F5DEB3", size: [0, 0, 0], type: "none" },
    hair7: { color: "#E6C200", size: [0.66, 0.22, 0.56], type: "top" },
    hair8: { color: "#E74C3C", size: [0.18, 0.7, 0.18], type: "mohawk" },
    hair9: { color: "#4B0082", size: [0.66, 0.4, 0.7], type: "ponytail" },
    hair10: { color: "#C0392B", size: [0.74, 0.38, 0.64], type: "full" },
  };
  return variants[hair] || variants.hair1;
}

function getPantsVariant(pants: string): VariantStyle {
  const variants: Record<string, VariantStyle> = {
    pants1: { color: "#4A90E2", size: [0.25, 0.8, 0.25] },
    pants2: { color: "#87CEEB", size: [0.25, 0.8, 0.25] },
    pants3: { color: "#FF69B4", size: [0.25, 0.8, 0.25] },
    pants4: { color: "#32CD32", size: [0.25, 0.8, 0.25] },
    pants5: { color: "#9370DB", size: [0.25, 0.8, 0.25] },
    pants6: { color: "#FF8C00", size: [0.25, 0.8, 0.25] },
    pants7: { color: "#20B2AA", size: [0.25, 0.8, 0.25] },
    pants8: { color: "#DC143C", size: [0.25, 0.8, 0.25] },
  };
  return variants[pants] || variants.pants1;
}

function getHeadwearVariant(headwear: string): VariantStyle {
  // size = [width, height, depth] in head-relative units.
  // 'tophat' = tall cylinder with a brim (narrow, tall, narrow)
  // 'sunhat' = wide and flat (very wide, short, very wide)
  // 'crown' = short golden jagged shape (medium, short, medium)
  // 'cap' = baseball cap shape (medium, short, shallow with visor)
  // 'beanie' = snug rounded shape (medium, medium, medium)
  // 'none' = no headwear
  const variants: Record<string, VariantStyle> = {
    none: { color: "transparent", size: [0, 0, 0], type: "none" },
    hat1: { color: "#1A1A1A", size: [0.3, 0.55, 0.3], type: "tophat" },
    hat2: { color: "#F4D88C", size: [0.85, 0.18, 0.85], type: "sunhat" },
    crown: { color: "#FFD700", size: [0.5, 0.22, 0.5], type: "crown" },
    cap: { color: "#C0392B", size: [0.55, 0.25, 0.5], type: "cap" },
    beanie: { color: "#2E5A88", size: [0.5, 0.4, 0.5], type: "beanie" },
    hat3: { color: "#6B3FA0", size: [0.3, 0.55, 0.3], type: "tophat" },
    hat4: { color: "#E67E22", size: [0.85, 0.18, 0.85], type: "sunhat" },
  };
  return variants[headwear] || variants.none;
}

function getShoesVariant(shoes: string): VariantStyle {
  // size = [length, height, width] in foot-relative units.
  // Footwear is longer than it is tall; boots are taller, sneakers are wider,
  // dress shoes are lower. Distinct colors per variant.
  const variants: Record<string, VariantStyle> = {
    shoes1: { color: "#F5F5F5", size: [0.42, 0.12, 0.28], type: "sneaker" },
    shoes2: { color: "#5C3A21", size: [0.44, 0.28, 0.26], type: "boot" },
    shoes3: { color: "#FF1493", size: [0.42, 0.14, 0.28], type: "sneaker" },
    shoes4: { color: "#7A4A2B", size: [0.4, 0.1, 0.24], type: "dress" },
    shoes5: { color: "#1C1C1C", size: [0.42, 0.1, 0.26], type: "dress" },
    shoes6: { color: "#00B3B3", size: [0.44, 0.16, 0.3], type: "sneaker" },
    shoes7: { color: "#E6B800", size: [0.42, 0.12, 0.28], type: "sneaker" },
    shoes8: { color: "#2E8B57", size: [0.46, 0.3, 0.27], type: "boot" },
  };
  return variants[shoes] || variants.shoes1;
}
