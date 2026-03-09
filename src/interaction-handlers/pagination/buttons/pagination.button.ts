import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { EMPTY_CHAR } from "../../../lib/constants";
import { PaginationInteractionCustomId } from "../../../lib/types/enum/custom-ids.types";
import { PaginationButtonAction } from "../../../lib/types/enum/pagination.types";
import { PaginationTextInputCustomIds } from "../../../lib/types/enum/text-input.types";
import type { PaginationStore } from "../../../lib/types/store.types";
import { ensureUsedBySameUser, validCustomId } from "../../../lib/utils/decorator.util";
import { buildCustomId, parseCustomId } from "../../../lib/utils/discord.util";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class PaginationButton extends InteractionHandler {
  @ensureUsedBySameUser()
  @validCustomId(PaginationInteractionCustomId.PAGINATION_ACTION_MOVE)
  public override async parse(interaction: ButtonInteraction) {
    const { ctx } = parseCustomId(interaction.customId);
    if (!ctx.dataStoreId || !ctx.data) {
      return this.none();
    }

    const data = this.container.utilities.actionStore.get<PaginationStore>(ctx.dataStoreId);
    if (!data) {
      return this.none();
    }

    return this.some({
      dataStoreId: ctx.dataStoreId,
      ...data,
      paginationAction: ctx.data as PaginationButtonAction,
    });
  }

  public override async run(
    interaction: ButtonInteraction,
    { dataStoreId, handleSetPage, state, paginationAction }: InteractionHandler.ParseResult<this>,
  ) {
    switch (paginationAction) {
      case PaginationButtonAction.MAX_LEFT:
        state.currentPage = 1;
        break;
      case PaginationButtonAction.LEFT:
        state.currentPage--;
        break;
      case PaginationButtonAction.SELECT_PAGE:
        return interaction.showModal(new ModalBuilder()
          .setTitle(EMPTY_CHAR)
          .setCustomId(
            buildCustomId(
              PaginationInteractionCustomId.PAGINATION_ACTION_SELECT_PAGE,
              interaction.user.id,
              { dataStoreId },
            ),
          )
          .setComponents(
            new ActionRowBuilder<TextInputBuilder>().setComponents(
              new TextInputBuilder()
                .setLabel("New Page Number")
                .setPlaceholder("1")
                .setStyle(TextInputStyle.Short)
                .setCustomId(PaginationTextInputCustomIds.GO_TO_PAGE_NUMBER),
            ),
          ));
      case PaginationButtonAction.RIGHT:
        state.currentPage++;
        break;
      case PaginationButtonAction.MAX_RIGHT:
        state.currentPage = state.totalPages;
        break;
      default:
        throw new Error("Unexpected customId for pagination");
    }

    await interaction.deferUpdate();

    const { embedPresets } = this.container.utilities;

    await interaction.editReply({
      embeds: [embedPresets.getSuccessEmbed("⌛ Please wait...")],
      components: [],
    });

    const { buttonsRow, embed } = await handleSetPage(state);

    await interaction.editReply({
      embeds: [embed],
      components: [buttonsRow],
    });
  }
}
