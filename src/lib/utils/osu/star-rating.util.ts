import type { BeatmapResponse } from "../../types/api";
import { GameMode } from "../../types/api";

export function getBeatmapStarRating(beatmap: BeatmapResponse, mode?: GameMode) {
  switch (mode ?? beatmap.mode) {
    case GameMode.STANDARD:
      return beatmap.star_rating_osu.toFixed(2);
    case GameMode.TAIKO:
      return beatmap.star_rating_taiko.toFixed(2);
    case GameMode.CATCH_THE_BEAT:
      return beatmap.star_rating_ctb.toFixed(2);
    case GameMode.MANIA:
      return beatmap.star_rating_mania.toFixed(2);
    default:
      return -1;
  }
}
