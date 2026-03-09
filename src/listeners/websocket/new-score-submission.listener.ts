import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import type { ScoreResponse } from "../../lib/types/api";
import { getBeatmapById, WebSocketEventType } from "../../lib/types/api";

@ApplyOptions<Listener.Options>({
  event: WebSocketEventType.NEW_SCORE_SUBMITTED,
  emitter: container.client.ws,
})
export class NewScoreSubmissionListener extends Listener {
  public async run(score: ScoreResponse) {
    const { newScoresChannel } = this.container.config.ids;
    if (!newScoresChannel)
      return;

    this.container.client.logger.info(
      `NewScoreSubmissionListener: New score (id: ${score.id}) submitted, trying to send embed to scores channel.`,
    );

    const scoresChannel = await this.container.client.channels
      .fetch(newScoresChannel.toString())
      .catch(() =>
        this.container.client.logger.error(
          "NewScoreSubmissionListener: Couldn't fetch scores channel",
        ),
      );

    if (!scoresChannel || !scoresChannel.isSendable()) {
      this.container.client.logger.error(
        `NewScoreSubmissionListener: Can't send new score embed. Check if scores channel ${newScoresChannel} exists.`,
      );
      return;
    }

    const beatmap = await getBeatmapById({
      path: {
        id: score.beatmap_id,
      },
    });

    if (!beatmap || beatmap.error) {
      this.container.client.logger.error(
        `NewScoreSubmissionListener: Couldn't fetch score's (id: ${score.id}) beatmap (id: ${score.beatmap_id}).`,
      );
      return;
    }

    const { embedPresets } = this.container.utilities;
    const scoreEmbed = await embedPresets.getScoreEmbed(score, beatmap.data, true);

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setURL(`https://${this.container.config.sunrise.uri}/score/${score.id}`)
        .setLabel("View score online")
        .setStyle(ButtonStyle.Link),
    );

    await scoresChannel.send({
      embeds: [scoreEmbed],
      components: [buttons],
    });
  }
}
