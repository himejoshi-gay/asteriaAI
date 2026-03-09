import { faker } from "@faker-js/faker";
import { container, InteractionHandlerStore, InteractionHandlerTypes } from "@sapphire/framework";
import type { jest } from "bun:test";
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { FakerGenerator } from "../../../../lib/mock/faker.generator";
import { Mocker } from "../../../../lib/mock/mocker";
import { PaginationInteractionCustomId } from "../../../../lib/types/enum/custom-ids.types";
import { PaginationSetPageModal } from "../pagination-set-page.model";

describe("Pagination Set Page Modal", () => {
  let errorHandler: jest.Mock;

  beforeAll(() => {
    Mocker.createSapphireClientInstance();
    errorHandler = Mocker.createErrorHandler();
  });

  afterAll(async () => {
    await Mocker.resetSapphireClientInstance();
  });

  beforeEach(() => Mocker.beforeEachCleanup(errorHandler));

  describe("parse", async () => {
    it("invalid interaction id provided", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        customId: "invalid_custom_id",
      });

      const result = await modal.parse(interaction);

      expect(result).toBe(modal.none());
    });

    it("invalid interaction id provided", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const customId = FakerGenerator.generateCustomId();

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        customId,
      });

      const result = await modal.parse(interaction);

      expect(result).toBe(modal.none());
    });

    it("valid interaction id provided", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const dataStoreId = container.utilities.actionStore.set(mock());

      const userId = faker.number.int().toString();

      const customId = FakerGenerator.generateCustomId({
        prefix: PaginationInteractionCustomId.PAGINATION_ACTION_SELECT_PAGE,
        userId,
        ctx: { dataStoreId },
      });

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        user: {
          id: userId,
        },
        customId,
      });

      const result = await modal.parse(interaction);

      expect(result).not.toBe(modal.none());
    });
  });

  describe("run", () => {
    it("should successfully navigate to a valid page", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 3" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "3");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      await modal.run(interaction, paginationData);

      expect(deferUpdateMock).toHaveBeenCalled();
      expect(getTextInputValueMock).toHaveBeenCalledWith("goToPageNumber");
      expect(paginationData.state.currentPage).toBe(3);
      expect(mockHandleSetPage).toHaveBeenCalledWith(paginationData.state);
      expect(editReplyMock).toHaveBeenCalledTimes(2);
    });

    it("should throw error when input is not a number", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const paginationData = FakerGenerator.generatePaginationData();

      const deferUpdateMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "not a number");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      expect(modal.run(interaction, paginationData)).rejects.toThrow("Not a number");
    });

    it("should throw error when page number is zero", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const paginationData = FakerGenerator.generatePaginationData();

      const deferUpdateMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "0");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      expect(modal.run(interaction, paginationData)).rejects.toThrow("Invalid page");
    });

    it("should throw error when page number is negative", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const paginationData = FakerGenerator.generatePaginationData();

      const deferUpdateMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "-1");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      expect(modal.run(interaction, paginationData)).rejects.toThrow("Invalid page");
    });

    it("should throw error when page number exceeds total pages", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const paginationData = FakerGenerator.generatePaginationData();

      const deferUpdateMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "6");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      expect(modal.run(interaction, paginationData)).rejects.toThrow("Invalid page");
    });

    it("should show loading message before calling handleSetPage", async () => {
      const modal = new PaginationSetPageModal(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.ModalSubmit },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 2" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));
      const getTextInputValueMock = mock(() => "2");

      const interaction = FakerGenerator.generateModalSubmitInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
        fields: {
          getTextInputValue: getTextInputValueMock,
        },
      });

      await modal.run(interaction, paginationData);

      expect(editReplyMock).toHaveBeenNthCalledWith(1, {
        embeds: [
          expect.objectContaining({
            data: expect.objectContaining({
              title: "⌛ Please wait...",
            }),
          }),
        ],
        components: [],
      });

      expect(editReplyMock).toHaveBeenNthCalledWith(2, {
        embeds: [expect.objectContaining({ title: "Page 2" })],
        components: [{ components: [] }],
      });
    });
  });
});
