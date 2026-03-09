import { ApplyOptions } from "@sapphire/decorators";
import { Utility } from "@sapphire/plugin-utilities-store";
import type {
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { PaginationInteractionCustomId } from "../lib/types/enum/custom-ids.types";
import { PaginationButtonAction } from "../lib/types/enum/pagination.types";
import type { PaginationStore } from "../lib/types/store.types";
import { buildCustomId } from "../lib/utils/discord.util";

@ApplyOptions<Utility.Options>({ name: "pagination" })
export class PaginationUtility extends Utility {
  private readonly buttonMaxLeft = new ButtonBuilder().setLabel("⏮️").setStyle(ButtonStyle.Primary);
  private readonly buttonLeft = new ButtonBuilder().setLabel("⬅️").setStyle(ButtonStyle.Primary);

  private readonly buttonRight = new ButtonBuilder().setLabel("➡️").setStyle(ButtonStyle.Primary);
  private readonly buttonMaxRight = new ButtonBuilder().setLabel("⏭️").setStyle(ButtonStyle.Primary);

  private readonly buttonSelectPage = new ButtonBuilder()
    .setLabel("*️⃣")
    .setStyle(ButtonStyle.Primary);

  public async createPaginationHandler(
    interaction: ChatInputCommandInteraction,
    handleSetPage: (state: {
      pageSize: number;
      totalPages: number;
      currentPage: number;
    }) => Promise<EmbedBuilder>,
    initState?: {
      pageSize?: number;
      totalPages?: number;
      currentPage?: number;
    },
  ) {
    const state = {
      pageSize: initState?.pageSize ?? 1,
      currentPage: initState?.currentPage ?? 1,
      totalPages: initState?.totalPages ?? 1,
    };

    const updatedEmbed = await handleSetPage(state);

    const handleSetPageWrapped = async (state: {
      pageSize: number;
      totalPages: number;
      currentPage: number;
    }) => ({
      buttonsRow: this.getPaginationButtonsRow(interaction.user.id, storeId, state),
      embed: await handleSetPage(state),
    });

    const storeId = this.container.utilities.actionStore.set<PaginationStore>({
      handleSetPage: handleSetPageWrapped,
      state,
    });

    const buttonsRow = this.getPaginationButtonsRow(interaction.user.id, storeId, state);

    await interaction.editReply({
      embeds: [updatedEmbed],
      components: [buttonsRow],
    });
  }

  private getPaginationButtonsRow(
    userId: string,
    storeId: string,
    options: {
      pageSize: number;
      currentPage: number;
      totalPages: number;
    },
  ) {
    const buttonsRow = new ActionRowBuilder<ButtonBuilder>();

    const { currentPage, totalPages } = options;

    const isOnFirstPage = currentPage <= 1;
    const isOnLastPage = currentPage >= totalPages;

    const getCustomPaginationButtonId = (buttonData: string) =>
      buildCustomId(PaginationInteractionCustomId.PAGINATION_ACTION_MOVE, userId, {
        dataStoreId: storeId,
        data: [buttonData],
      });

    buttonsRow.setComponents(
      ButtonBuilder.from(this.buttonMaxLeft.toJSON())
        .setCustomId(getCustomPaginationButtonId(PaginationButtonAction.MAX_LEFT))
        .setDisabled(isOnFirstPage),
      ButtonBuilder.from(this.buttonLeft.toJSON())
        .setCustomId(getCustomPaginationButtonId(PaginationButtonAction.LEFT))
        .setDisabled(isOnFirstPage),

      ButtonBuilder.from(this.buttonSelectPage.toJSON())
        .setCustomId(getCustomPaginationButtonId(PaginationButtonAction.SELECT_PAGE))
        .setDisabled(isOnFirstPage && isOnLastPage),
    );

    buttonsRow.addComponents(
      ButtonBuilder.from(this.buttonRight.toJSON())
        .setCustomId(getCustomPaginationButtonId(PaginationButtonAction.RIGHT))
        .setDisabled(isOnLastPage),
      ButtonBuilder.from(this.buttonMaxRight.toJSON())
        .setCustomId(getCustomPaginationButtonId(PaginationButtonAction.MAX_RIGHT))
        .setDisabled(isOnLastPage),
    );

    return buttonsRow;
  }
}
