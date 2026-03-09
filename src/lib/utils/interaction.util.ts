import type { AnyInteraction } from "@sapphire/discord.js-utilities";
import type { AutocompleteInteraction } from "discord.js";

import type { EmbedPresetsUtility } from "../../utilities/embed-presets.utility";

export function interactionError(
  embedPresets: EmbedPresetsUtility,
  interaction: Exclude<AnyInteraction, AutocompleteInteraction>,
  message: string,
) {
  const payload = {
    embeds: [embedPresets.getErrorEmbed("Uh-oh!", message)],
    ephemeral: true,
  };

  return interaction.deferred || interaction.replied
    ? interaction.followUp(payload)
    : interaction.reply(payload);
}
