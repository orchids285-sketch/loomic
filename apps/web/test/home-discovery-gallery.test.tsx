// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeDiscoveryGallery } from "@/components/home-discovery-gallery";
import { homeDiscoverySeedCategories } from "@/lib/home-discovery-seeds";

describe("HomeDiscoveryGallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows all discovery cards by default", () => {
    render(
      <HomeDiscoveryGallery
        categories={homeDiscoverySeedCategories}
        onCaseSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The ART & Cultural Arts Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vintage Car Poster" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cat Tarot Cards" })).toBeInTheDocument();
  });

  it("filters cards when a category tab is selected", async () => {
    render(
      <HomeDiscoveryGallery
        categories={homeDiscoverySeedCategories}
        onCaseSelect={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Branding" }));

    expect(screen.getByRole("button", { name: "The ART & Cultural Arts Center" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vintage Car Poster" })).not.toBeInTheDocument();
  });

  it("emits the internal Loomic seed payload when a card is clicked", async () => {
    const onCaseSelect = vi.fn();

    render(
      <HomeDiscoveryGallery
        categories={homeDiscoverySeedCategories}
        onCaseSelect={onCaseSelect}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "The ART & Cultural Arts Center" }),
    );

    expect(onCaseSelect).toHaveBeenCalledWith({
      authorAvatarUrl:
        "https://lh3.googleusercontent.com/a/ACg8ocJ0nBUJkE5T9tLTwRlVXScB576EqOEeRS-6__BLxjYxrO5Jtxjjig=s96-c",
      authorName: "Ken Allman",
      categoryKey: "branding-design",
      categoryLabel: "Branding",
      coverImageUrl: expect.stringContaining("supabase.co"),
      id: "ji5ey5l",
      likeCount: 7,
      prompt:
        "Using ART & Cultural Arts Center as the direction, build a brand exploration for a cultural arts centre. Output brand keywords, a key visual direction, poster extensions and social media visual proposals -- modern, culturally rich, and suited to promoting arts events.",
      title: "The ART & Cultural Arts Center",
      viewCount: 549,
    });
  });
});
