import { faker } from "@faker-js/faker";
import { container, InteractionHandlerStore, InteractionHandlerTypes } from "@sapphire/framework";
import type { jest } from "bun:test";
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { EMPTY_CHAR } from "../../../../lib/constants";
import { FakerGenerator } from "../../../../lib/mock/faker.generator";
import { Mocker } from "../../../../lib/mock/mocker";
import { PaginationInteractionCustomId } from "../../../../lib/types/enum/custom-ids.types";
import { PaginationButtonAction } from "../../../../lib/types/enum/pagination.types";
import { PaginationButton } from "../pagination.button";

describe("Pagination Button", () => {
  let errorHandler: jest.Mock;

  beforeAll(() => {
    Mocker.createSapphireClientInstance();
    errorHandler = Mocker.createErrorHandler();
  });

  afterAll(async () => {
    await Mocker.resetSapphireClientInstance();
  });

  beforeEach(() => Mocker.beforeEachCleanup(errorHandler));

  describe("parse", () => {
    it("should return none when invalid custom id is provided", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const interaction = FakerGenerator.generateButtonInteraction({
        customId: "invalid_custom_id",
      });

      const result = await button.parse(interaction);

      expect(result).toBe(button.none());
    });

    it("should return none when no dataStoreId is provided", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const userId = faker.number.int().toString();

      const customId = FakerGenerator.generateCustomId({
        prefix: PaginationInteractionCustomId.PAGINATION_ACTION_MOVE,
        userId,
        ctx: {},
      });

      const interaction = FakerGenerator.generateButtonInteraction({
        user: {
          id: userId,
        },
        customId,
      });

      const result = await button.parse(interaction);

      expect(result).toBe(button.none());
    });

    it("should return none when no data is provided", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const dataStoreId = container.utilities.actionStore.set(mock());
      const userId = faker.number.int().toString();

      const customId = FakerGenerator.generateCustomId({
        prefix: PaginationInteractionCustomId.PAGINATION_ACTION_MOVE,
        userId,
        ctx: { dataStoreId },
      });

      const interaction = FakerGenerator.generateButtonInteraction({
        user: {
          id: userId,
        },
        customId,
      });

      const result = await button.parse(interaction);

      expect(result).toBe(button.none());
    });

    it("should return none when dataStore does not exist", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const userId = faker.number.int().toString();

      const customId = FakerGenerator.generateCustomId({
        prefix: PaginationInteractionCustomId.PAGINATION_ACTION_MOVE,
        userId,
        ctx: {
          dataStoreId: faker.string.uuid(),
          data: [PaginationButtonAction.LEFT],
        },
      });

      const interaction = FakerGenerator.generateButtonInteraction({
        user: {
          id: userId,
        },
        customId,
      });

      const result = await button.parse(interaction);

      expect(result).toBe(button.none());
    });

    it("should return some when valid button interaction is provided", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const paginationData = FakerGenerator.generatePaginationData();
      const dataStoreId = container.utilities.actionStore.set(paginationData);

      const userId = faker.number.int().toString();

      const customId = FakerGenerator.generateCustomId({
        prefix: PaginationInteractionCustomId.PAGINATION_ACTION_MOVE,
        userId,
        ctx: {
          dataStoreId,
          data: [PaginationButtonAction.RIGHT],
        },
      });

      const interaction = FakerGenerator.generateButtonInteraction({
        user: {
          id: userId,
        },
        customId,
      });

      const result = await button.parse(interaction);

      expect(result).not.toBe(button.none());
    });
  });

  describe("run", () => {
    it("should navigate to first page when MAX_LEFT is clicked", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 1" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
        state: {
          currentPage: 3,
          totalPages: 5,
        },
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
      });

      await button.run(interaction, {
        ...paginationData,
        paginationAction: PaginationButtonAction.MAX_LEFT,
      } as any);

      expect(deferUpdateMock).toHaveBeenCalled();
      expect(paginationData.state.currentPage).toBe(1);
      expect(mockHandleSetPage).toHaveBeenCalledWith(paginationData.state);
      expect(editReplyMock).toHaveBeenCalledTimes(2);
    });

    it("should navigate to previous page when LEFT is clicked", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 2" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
        state: {
          currentPage: 3,
          totalPages: 5,
        },
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
      });

      await button.run(interaction, {
        ...paginationData,
        paginationAction: PaginationButtonAction.LEFT,
      } as any);

      expect(deferUpdateMock).toHaveBeenCalled();
      expect(paginationData.state.currentPage).toBe(2);
      expect(mockHandleSetPage).toHaveBeenCalledWith(paginationData.state);
      expect(editReplyMock).toHaveBeenCalledTimes(2);
    });

    it("should show modal when SELECT_PAGE is clicked", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const paginationData = FakerGenerator.generatePaginationData();
      const dataStoreId = container.utilities.actionStore.set(paginationData);

      const showModalMock = mock();
      const userId = faker.number.int().toString();

      const interaction = FakerGenerator.generateButtonInteraction({
        showModal: showModalMock,
        user: {
          id: userId,
        },
      });

      await button.run(interaction, {
        ...paginationData,
        dataStoreId,
        paginationAction: PaginationButtonAction.SELECT_PAGE,
      } as any);

      expect(showModalMock).toHaveBeenCalled();
      expect(showModalMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: EMPTY_CHAR,
            custom_id: expect.stringContaining(
              PaginationInteractionCustomId.PAGINATION_ACTION_SELECT_PAGE,
            ),
          }),
        }),
      );
    });

    it("should navigate to next page when RIGHT is clicked", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 4" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
        state: {
          currentPage: 3,
          totalPages: 5,
        },
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
      });

      await button.run(interaction, {
        ...paginationData,
        paginationAction: PaginationButtonAction.RIGHT,
      } as any);

      expect(deferUpdateMock).toHaveBeenCalled();
      expect(paginationData.state.currentPage).toBe(4);
      expect(mockHandleSetPage).toHaveBeenCalledWith(paginationData.state);
      expect(editReplyMock).toHaveBeenCalledTimes(2);
    });

    it("should navigate to last page when MAX_RIGHT is clicked", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 5" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
        state: {
          currentPage: 3,
          totalPages: 5,
        },
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
      });

      await button.run(interaction, {
        ...paginationData,
        paginationAction: PaginationButtonAction.MAX_RIGHT,
      } as any);

      expect(deferUpdateMock).toHaveBeenCalled();
      expect(paginationData.state.currentPage).toBe(5);
      expect(mockHandleSetPage).toHaveBeenCalledWith(paginationData.state);
      expect(editReplyMock).toHaveBeenCalledTimes(2);
    });

    it("should show loading message before calling handleSetPage", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const mockHandleSetPage = mock(async (_state: any) => ({
        embed: { title: "Page 2" },
        buttonsRow: { components: [] },
      }));

      const paginationData = FakerGenerator.generatePaginationData({
        handleSetPage: mockHandleSetPage,
        state: {
          currentPage: 1,
          totalPages: 5,
        },
      });

      const deferUpdateMock = mock(async () => ({}));
      const editReplyMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
        editReply: editReplyMock,
      });

      await button.run(interaction, {
        ...paginationData,
        paginationAction: PaginationButtonAction.RIGHT,
      } as any);

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

    it("should throw error when unexpected pagination action is provided", async () => {
      const button = new PaginationButton(
        { ...FakerGenerator.generateLoaderContext(), store: new InteractionHandlerStore() },
        { interactionHandlerType: InteractionHandlerTypes.Button },
      );

      const paginationData = FakerGenerator.generatePaginationData();

      const deferUpdateMock = mock(async () => ({}));

      const interaction = FakerGenerator.generateButtonInteraction({
        deferUpdate: deferUpdateMock,
      });

      expect(
        button.run(interaction, {
          ...paginationData,
          paginationAction: "INVALID_ACTION" as any,
        } as any),
      ).rejects.toThrow("Unexpected customId for pagination");
    });
  });
});
