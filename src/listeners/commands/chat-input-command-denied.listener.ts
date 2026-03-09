import { ApplyOptions } from "@sapphire/decorators";
import type { ChatInputCommandDeniedPayload, UserError } from "@sapphire/framework";
import { Events, Identifiers, Listener } from "@sapphire/framework";
import { MessageFlags, time } from "discord.js";

@ApplyOptions<Listener.Options>({
  name: Events.ChatInputCommandDenied,
})
export class ChatInputCommandDeniedListener extends Listener {
  public override async run(
    { context, message: content, identifier }: UserError,
    { interaction }: ChatInputCommandDeniedPayload,
  ) {
    if (Reflect.get(new Object(context), "silent"))
      return;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    if (identifier === Identifiers.PreconditionCooldown) {
      const { remaining } = new Object(context);

      const { embedPresets } = this.container.utilities;

      const cooldownEmbed = embedPresets.getErrorEmbed(
        "Hold up!",
        `😵‍💫 You are too fast for me! You can request again in ${time(
          Math.floor((Date.now() + remaining) / 1000),
          "R",
        )}`,
      );

      return interaction.editReply({ embeds: [cooldownEmbed] });
    }

    return interaction.editReply({ content });
  }
}
