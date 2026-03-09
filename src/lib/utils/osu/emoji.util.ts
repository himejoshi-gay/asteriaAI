import { config } from "../../configs/env";
import { BeatmapStatusWeb } from "../../types/api";

export function getScoreRankEmoji(rank: string) {
  switch (rank) {
    case "F":
      return config.json.emojis.ranks.F;
    case "D":
      return config.json.emojis.ranks.D;
    case "C":
      return config.json.emojis.ranks.C;
    case "B":
      return config.json.emojis.ranks.B;
    case "A":
      return config.json.emojis.ranks.A;
    case "S":
      return config.json.emojis.ranks.S;
    case "SH":
      return config.json.emojis.ranks.SH;
    case "X":
      return config.json.emojis.ranks.X;
    case "XH":
      return config.json.emojis.ranks.XH;
  }
}

export default function getBeatmapStatusIcon(status: BeatmapStatusWeb) {
  switch (status) {
    case BeatmapStatusWeb.LOVED:
      return "❤️";
    case BeatmapStatusWeb.QUALIFIED:
      return "☑️";
    case BeatmapStatusWeb.APPROVED:
      return "✅";
    case BeatmapStatusWeb.RANKED:
      return config.json.emojis.rankedStatus;
    case BeatmapStatusWeb.GRAVEYARD:
      return "🪦";
    case BeatmapStatusWeb.WIP:
      return "🚧";
    case BeatmapStatusWeb.PENDING:
      return "⌚";
    case BeatmapStatusWeb.UNKNOWN:
      return "❓";
  }
}
