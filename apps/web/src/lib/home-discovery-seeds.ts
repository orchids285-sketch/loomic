export type HomeDiscoveryCase = {
  id: string;
  title: string;
  coverImageUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  viewCount: number;
  likeCount: number;
  prompt: string;
  sourceUrl?: string;
};

export type HomeDiscoveryCategory = {
  key: string;
  label: string;
  cases: HomeDiscoveryCase[];
};

export type HomeDiscoverySelection = HomeDiscoveryCase & {
  categoryKey: string;
  categoryLabel: string;
};

function createCase(
  id: string,
  title: string,
  coverImageUrl: string,
  authorName: string,
  authorAvatarUrl: string,
  viewCount: number,
  likeCount: number,
  prompt: string,
  sourceUrl?: string,
): HomeDiscoveryCase {
  return {
    id,
    title,
    coverImageUrl,
    authorName,
    authorAvatarUrl,
    viewCount,
    likeCount,
    prompt,
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

function createCategory(
  key: string,
  label: string,
  cases: HomeDiscoveryCase[],
): HomeDiscoveryCategory {
  return { key, label, cases };
}

/**
 * Discovery seeds mirrored from Lovart's lower "Discover" section.
 * Each category intentionally starts with one case so the team can replace
 * content later from Supabase without touching the UI layer.
 */
export const homeDiscoverySeedCategories: HomeDiscoveryCategory[] = [
  createCategory("branding-design", "Branding", [
    createCase(
      "ji5ey5l",
      "The ART & Cultural Arts Center",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/branding-design/cover.webp",
      "Studio Arken",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/branding-design.svg",
      549,
      7,
      "Using ART & Cultural Arts Center as the direction, build a brand exploration for a cultural arts centre. Output brand keywords, a key visual direction, poster extensions and social media visual proposals -- modern, culturally rich, and suited to promoting arts events.",
    ),
  ]),
  createCategory("poster-and-ads", "Posters and ads", [
    createCase(
      "n9d21de",
      "Vintage Car Poster",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/poster-and-ads/cover.webp",
      "Retro Workshop",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/poster-and-ads.svg",
      359919,
      286,
      "Around Vintage Car Poster, design a set of retro car posters. Include the main poster, a square social media version and title typography suggestions -- retro, filmic, suited to event promotion.",
    ),
  ]),
  createCategory("illustration", "Illustration", [
    createCase(
      "bjde0nh",
      "Cat Tarot Cards",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/illustration/cover.webp",
      "Mochi Art",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/illustration.svg",
      2054,
      116,
      "Taking Cat Tarot Cards as the theme, expand a cat tarot illustration series. Give me the character sheet, card visual language, colour suggestions and extendable merchandise directions.",
    ),
  ]),
  createCategory("ui-design", "UI design", [
    createCase(
      "tl8zzk0",
      "Fallout-themed cake shop website.",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/ui-design/cover.webp",
      "Pixel Forge",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/ui-design.svg",
      4338,
      192,
      "Inspired by Fallout-themed cake shop website, design a post-apocalyptic cake shop site. Output the homepage information architecture, the above-the-fold visual, product card styling and a core colour palette.",
    ),
  ]),
  createCategory("character-design", "Character design", [
    createCase(
      "fbn3mss",
      "My Creepy Clown Avatar in Abandoned Circus Park",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/character-design/cover.webp",
      "Dark Carnival",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/character-design.svg",
      749,
      12,
      "Around the concept My Creepy Clown Avatar in Abandoned Circus Park, design an eerie circus character set. Include the character sheet, expression variations, costume elements and scene atmosphere suggestions.",
    ),
  ]),
  createCategory("storyboard-video", "Film and storyboards", [
    createCase(
      "ikqo02k",
      "Mixtapes Emotions !",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/storyboard-video/cover.webp",
      "Frame Studio",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/storyboard-video.svg",
      3057,
      49,
      "Based on Mixtapes Emotions, build a storyboard for a music mood short. Break out shot rhythm, emotional transitions, title cards and visual style, suited to a 15-30 second video.",
    ),
  ]),
  createCategory("product-design", "Product design", [
    createCase(
      "a4ncmvb",
      "Product Visualization - Robot Hand ",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/product-design/cover.webp",
      "Future Lab",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/product-design.svg",
      769,
      27,
      "Around the concept Product Visualization - Robot Hand, design a set of futuristic robotic hand product visuals. Give me the selling points, key visual composition, material direction and e-commerce display ideas.",
    ),
  ]),
  createCategory("architecture-design", "Architecture", [
    createCase(
      "ng716s0",
      "Building a new website and learning how to AI",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/architecture-design/cover.webp",
      "Arc Design",
      "https://jmcrxgenontlkxktpihl.supabase.co/storage/v1/object/public/project-assets/home-seeds/discovery/avatars/architecture-design.svg",
      1453,
      24,
      "Starting from Building a new website and learning how to AI, design a website concept for an architecture studio. Output the site structure, homepage visuals, a project showcase module and overall architectural style suggestions.",
    ),
  ]),
];
