import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ModalSubmitInteraction } from "discord.js";

import { ExtendedError } from "../../../lib/extended-error";
import { PaginationInteractionCustomId } from "../../../lib/types/enum/custom-ids.types";
import { PaginationTextInputCustomIds } from "../../../lib/types/enum/text-input.types";
import type { PaginationStore } from "../../../lib/types/store.types";
import { ensureUsedBySameUser, validCustomId } from "../../../lib/utils/decorator.util";
import { parseCustomId } from "../../../lib/utils/discord.util";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class PaginationSetPageModal extends InteractionHandler {
  @ensureUsedBySameUser()
  @validCustomId(PaginationInteractionCustomId.PAGINATION_ACTION_SELECT_PAGE)
  public override async parse(interaction: ModalSubmitInteraction) {
    const { ctx } = parseCustomId(interaction.customId);
    if (!ctx.dataStoreId) {
      return this.none();
    }

    const data = this.container.utilities.actionStore.get<PaginationStore>(ctx.dataStoreId);
    if (!data) {
      return this.none();
    }

    return this.some(data);
  }

  public override async run(
    interaction: ModalSubmitInteraction,
    { handleSetPage, state }: InteractionHandler.ParseResult<this>,
  ) {
    await interaction.deferUpdate();

    const page = interaction.fields.getTextInputValue(
      PaginationTextInputCustomIds.GO_TO_PAGE_NUMBER,
    );

    if (Number.isNaN(Number(page))) {
      throw new ExtendedError("Not a number");
    }

    const pageNum = Number(page);

    if (pageNum <= 0 || pageNum > state.totalPages) {
      throw new ExtendedError("Invalid page");
    }

    state.currentPage = pageNum;

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
