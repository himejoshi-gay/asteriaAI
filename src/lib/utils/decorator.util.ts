import { createMethodDecorator } from "@sapphire/decorators";
import { Option } from "@sapphire/framework";
import type {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

export function validCustomId(...customIds: string[]): MethodDecorator {
  return createMethodDecorator((_, __, descriptor: any) => {
    const method = descriptor.value;
    if (typeof method !== "function") {
      throw new TypeError("This can only be used on class methods");
    }

    descriptor.value = async function setValue(
      this: (...args: any[]) => any,
      interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
    ) {
      if (!customIds.some(id => interaction.customId.startsWith(id))) {
        return Option.none;
      }

      return method.call(this, interaction);
    } as unknown as undefined;
  });
}

export function ensureUsedBySameUser(): MethodDecorator {
  return createMethodDecorator((_, __, descriptor: any) => {
    const method = descriptor.value;
    if (typeof method !== "function") {
      throw new TypeError("This can only be used on class methods");
    }

    descriptor.value = async function setValue(
      this: (...args: any[]) => any,
      interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
    ) {
      if (interaction.customId.split(":")?.[1] !== interaction.user.id) {
        return Option.none;
      }

      return method.call(this, interaction);
    } as unknown as undefined;
  });
}
