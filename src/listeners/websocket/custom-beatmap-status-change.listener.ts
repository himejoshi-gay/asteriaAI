import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";

import type { CustomBeatmapStatusChangeResponse } from "../../lib/types/api";
import { WebSocketEventType } from "../../lib/types/api";

@ApplyOptions<Listener.Options>({
  event: WebSocketEventType.CUSTOM_BEATMAP_STATUS_CHANGED,
  emitter: container.client.ws,
})
export class CustomBeatmapStatusChangeListener extends Listener {
  public async run(data: CustomBeatmapStatusChangeResponse) {
    const { beatmapsEventsChannel } = this.container.config.ids;
    if (!beatmapsEventsChannel)
      return;

    const beatmapsChannel = await this.container.client.channels
      .fetch(beatmapsEventsChannel.toString())
      .catch(() =>
        this.container.client.logger.error(
          "CustomBeatmapStatusChangeListener: Couldn't fetch beatmaps event channel",
        ),
      );

    if (!beatmapsChannel || !beatmapsChannel.isSendable()) {
      this.container.client.logger.error(
        `CustomBeatmapStatusChangeListener: Can't send custom beatmap status change event. Check if beatmaps channel ${beatmapsEventsChannel} exists.`,
      );
      return;
    }

    const { embedPresets } = this.container.utilities;
    const beatmapStatusChangeEventEmbed = await embedPresets.getCustomBeatmapStatusChangeEmbed(data);

    await beatmapsChannel.send({
      embeds: [beatmapStatusChangeEventEmbed],
    });
  }
}
