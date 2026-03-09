import { beforeEach, describe, expect, it } from "bun:test";

import { FakerGenerator } from "../../mock/faker.generator";
import type { BeatmapResponse } from "../../types/api";
import { GameMode } from "../../types/api";
import { getBeatmapStarRating } from "../osu/star-rating.util";

describe("star-rating.util", () => {
  describe("getBeatmapStarRating", () => {
    let beatmap: BeatmapResponse = null!;

    beforeEach(() => {
      beatmap = FakerGenerator.generateBeatmap();
    });

    it("should return correct star rating for STANDARD mode", () => {
      const starRating = getBeatmapStarRating(beatmap, GameMode.STANDARD);

      expect(starRating).toBe(beatmap.star_rating_osu.toFixed(2));
    });

    it("should return correct star rating for TAIKO mode", () => {
      const starRating = getBeatmapStarRating(beatmap, GameMode.TAIKO);
      expect(starRating).toBe(beatmap.star_rating_taiko.toFixed(2));
    });

    it("should return correct star rating for CATCH_THE_BEAT mode", () => {
      const starRating = getBeatmapStarRating(beatmap, GameMode.CATCH_THE_BEAT);
      expect(starRating).toBe(beatmap.star_rating_ctb.toFixed(2));
    });

    it("should return correct star rating for MANIA mode", () => {
      const starRating = getBeatmapStarRating(beatmap, GameMode.MANIA);
      expect(starRating).toBe(beatmap.star_rating_mania.toFixed(2));
    });

    it("should return -1 for unknown game mode", () => {
      const starRating = getBeatmapStarRating(beatmap, "UNKNOWN_MODE" as GameMode);
      expect(starRating).toBe(-1);
    });

    it("should return star rating based on beatmap mode when no mode is provided", () => {
      beatmap = FakerGenerator.generateBeatmap({ mode: GameMode.TAIKO });

      const starRating = getBeatmapStarRating(beatmap);

      expect(starRating).toBe(beatmap.star_rating_taiko.toFixed(2));
    });
  });
});
