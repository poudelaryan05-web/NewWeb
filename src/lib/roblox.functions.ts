import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getGameInfo = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ placeId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const placeId = data.placeId.trim();
    if (!/^\d+$/.test(placeId)) {
      throw new Error("Invalid Game ID. Please enter a numeric Roblox Place ID.");
    }

    // 1. place -> universe
    const uniRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
    );
    if (!uniRes.ok) throw new Error("Failed to look up game. Check the ID.");
    const uniJson = (await uniRes.json()) as { universeId: number | null };
    const universeId = uniJson.universeId;
    if (!universeId) throw new Error("No game found for that ID.");

    // 2. game info
    const [infoRes, thumbRes] = await Promise.all([
      fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`,
      ),
    ]);

    if (!infoRes.ok) throw new Error("Failed to load game info.");
    const infoJson = (await infoRes.json()) as {
      data: Array<{
        id: number;
        rootPlaceId: number;
        name: string;
        description: string;
        creator: { name: string; type: string };
        visits: number;
        favoritedCount: number;
        playing: number;
      }>;
    };
    const game = infoJson.data?.[0];
    if (!game) throw new Error("Game not found.");

    let thumbnail = "";
    if (thumbRes.ok) {
      const t = (await thumbRes.json()) as {
        data: Array<{ imageUrl: string | null }>;
      };
      thumbnail = t.data?.[0]?.imageUrl ?? "";
    }

    return {
      name: game.name,
      creator: game.creator.name,
      placeId: game.rootPlaceId,
      universeId,
      visits: game.visits,
      favorites: game.favoritedCount,
      playing: game.playing,
      thumbnail,
    };
  });
