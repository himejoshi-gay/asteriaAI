import { ApplyOptions } from "@sapphire/decorators";
import { isAnyInteractableInteraction } from "@sapphire/discord.js-utilities";
import type { InteractionHandlerError } from "@sapphire/framework";
import { Events, Listener } from "@sapphire/framework";

import { ExtendedError } from "../../lib/extended-error";
import { interactionError } from "../../lib/utils/interaction.util";

@ApplyOptions<Listener.Options>({ name: Events.InteractionHandlerError })
export class InteractionHandlerErrorEvent extends Listener<typeof Events.InteractionHandlerError> {
  public override async run(error: Error, { interaction, handler }: InteractionHandlerError) {
    if (isAnyInteractableInteraction(interaction)) {
      const { embedPresets } = this.container.utilities;

      if (error instanceof ExtendedError) {
        interactionError(embedPresets, interaction, error.message);
      }
      else {
        interactionError(embedPresets, interaction, "Something went wrong... Sorry!");
        this.container.logger.error(handler.name, error);
      }
    }
  }
}
