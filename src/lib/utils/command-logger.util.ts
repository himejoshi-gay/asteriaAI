import type {
  ChatInputCommand,
  ChatInputCommandErrorPayload,
  ChatInputCommandSuccessPayload,
} from "@sapphire/framework";
import { container } from "@sapphire/pieces";
import type {
  ChatInputCommandSubcommandMappingMethod,
  ChatInputSubcommandErrorPayload,
  ChatInputSubcommandSuccessPayload,
  Subcommand,
} from "@sapphire/plugin-subcommands";
import { cyan } from "colorette";
import type { APIUser, Guild, User } from "discord.js";

function getShardInfo(id: number) {
  return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: ChatInputCommand | Subcommand) {
  return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
  return `${author.username} (${cyan(author.id)})`;
}

export function logCommand(
  payload:
    | ChatInputCommandSuccessPayload
    | ChatInputCommandErrorPayload
    | ChatInputSubcommandSuccessPayload
    | ChatInputSubcommandErrorPayload,
  subcommand?: ChatInputCommandSubcommandMappingMethod | string,
): void {
  let subcommandLog = "";

  if (subcommand) {
    if (typeof subcommand === "string") {
      subcommandLog = ` ${cyan(subcommand)}`;
    }
    else {
      subcommandLog = ` ${cyan(subcommand.name)}`;
    }
  }

  const data = getLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
  container.logger.info(
    `User ${data.author} used /${data.commandName.replace(".command", "")}${subcommandLog}`,
  );
}

function getLoggerData(guild: Guild | null, user: User, command: ChatInputCommand | Subcommand) {
  const shard = getShardInfo(guild?.shardId ?? 0);
  const commandName = getCommandInfo(command);
  const author = getAuthorInfo(user);

  return {
    shard,
    commandName,
    author,
  };
}
