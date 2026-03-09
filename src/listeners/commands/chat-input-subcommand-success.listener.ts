import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import type { ChatInputCommandSubcommandMappingMethod, ChatInputSubcommandSuccessPayload } from "@sapphire/plugin-subcommands";
import {
  SubcommandPluginEvents,
} from "@sapphire/plugin-subcommands";
import type { Interaction } from "discord.js";

import { logCommand } from "../../lib/utils/command-logger.util";

@ApplyOptions<Listener.Options>({
  name: SubcommandPluginEvents.ChatInputSubcommandSuccess,
})
export class ChatInputSubcommandSuccessListener extends Listener {
  public override run(
    _interaction: Interaction,
    subcommand: ChatInputCommandSubcommandMappingMethod,
    payload: ChatInputSubcommandSuccessPayload,
  ) {
    logCommand(payload, subcommand);
  }
}
