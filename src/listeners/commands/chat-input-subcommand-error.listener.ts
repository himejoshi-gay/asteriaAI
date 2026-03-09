import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import type { ChatInputSubcommandErrorPayload } from "@sapphire/plugin-subcommands";
import {
  SubcommandPluginEvents,
} from "@sapphire/plugin-subcommands";

import { ExtendedError } from "../../lib/extended-error";
import { logCommand } from "../../lib/utils/command-logger.util";
import { interactionError } from "../../lib/utils/interaction.util";

@ApplyOptions<Listener.Options>({
  name: SubcommandPluginEvents.ChatInputSubcommandError,
})
export class ChatInputSubcommandErrorListener extends Listener {
  public override run(error: Error, payload: ChatInputSubcommandErrorPayload) {
    logCommand(payload, payload.matchedSubcommandMapping.name);

    if (error instanceof ExtendedError) {
      const { embedPresets } = this.container.utilities;
      interactionError(embedPresets, payload.interaction, error.message);
    }
    else {
      this.container.logger.error(error);
    }
  }
}
