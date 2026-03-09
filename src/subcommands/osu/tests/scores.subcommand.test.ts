import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";

import { OsuCommand } from "../../../commands/osu.command";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";
import { GameMode, ScoreTableType } from "../../../lib/types/api";

describe("Osu Scores Subcommand", () => {
  let osuCommand: OsuCommand;
  let errorHandler: jest.Mock;

  beforeAll(() => {
    Mocker.createSapphireClientInstance();
    osuCommand = Mocker.createCommandInstance(OsuCommand);
    errorHandler = Mocker.createErrorHandler();
  });

  afterAll(async () => {
    await Mocker.resetSapphireClientInstance();
  });

  beforeEach(() => Mocker.beforeEachCleanup(errorHandler));

  it("should create pagination handler when username is provided", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    const paginationCreateMock = mock();
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).not.toBeCalled();
    expect(paginationCreateMock).toHaveBeenCalledWith(
      interaction,
      expect.any(Function),
      expect.objectContaining({
        pageSize: 10,
        currentPage: 1,
        totalPages: 0,
      }),
    );
  });

  it("should create pagination handler when Discord user is provided (linked account)", async () => {
    const discordUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.TAIKO;
    const scoreType = ScoreTableType.RECENT;

    const paginationCreateMock = mock();
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(discordUser),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: discordUser.id, $2: osuUserId.toString() });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).not.toBeCalled();
    expect(paginationCreateMock).toHaveBeenCalledWith(
      interaction,
      expect.any(Function),
      expect.objectContaining({
        pageSize: 10,
        currentPage: 1,
        totalPages: 0,
      }),
    );
  });

  it("should create pagination handler for current user (no options, linked account)", async () => {
    const currentUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.MANIA;
    const scoreType = ScoreTableType.BEST;

    const paginationCreateMock = mock();
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {
          getString: jest.fn((name: string) => {
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: currentUser.id, $2: osuUserId.toString() });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).not.toBeCalled();
    expect(paginationCreateMock).toHaveBeenCalledWith(
      interaction,
      expect.any(Function),
      expect.objectContaining({
        pageSize: 10,
        currentPage: 1,
        totalPages: 0,
      }),
    );
  });

  it("should throw error when username is not found", async () => {
    const username = faker.internet.username();
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find user with such username",
      }),
      expect.anything(),
    );
  });

  it("should throw error when Discord user has no linked account", async () => {
    const discordUser = FakerGenerator.generateUser();
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(discordUser),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ Provided user didn't link their himejoshi account",
      }),
      expect.anything(),
    );
  });

  it("should throw error when current user has no linked account", async () => {
    const currentUser = FakerGenerator.generateUser();
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {
          getString: jest.fn((name: string) => {
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ Provided user didn't link their himejoshi account",
      }),
      expect.anything(),
    );
  });

  it("should throw error when username search API fails", async () => {
    const username = faker.internet.username();
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        error: { error: "API Error" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find user with such username",
      }),
      expect.anything(),
    );
  });

  it("should handle pagination callback correctly with scores", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    let capturedPaginationHandler: any = null;
    const paginationCreateMock = mock((interaction: any, handler: any, _state: any) => {
      capturedPaginationHandler = handler;
      return Promise.resolve();
    });
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    expect(capturedPaginationHandler).not.toBeNull();

    const mockScore1 = FakerGenerator.generateScore();
    const mockScore2 = FakerGenerator.generateScore();
    const mockBeatmap1 = FakerGenerator.generateBeatmap({ id: mockScore1.beatmap_id });
    const mockBeatmap2 = FakerGenerator.generateBeatmap({ id: mockScore2.beatmap_id });

    Mocker.mockApiRequests({
      getUserByIdScores: async () => ({
        data: { scores: [mockScore1, mockScore2], total_count: 20 },
      }),
      getBeatmapById: async ({ path }: { path: { id: number } }) => {
        if (path.id === mockScore1.beatmap_id)
          return { data: mockBeatmap1 };
        if (path.id === mockScore2.beatmap_id)
          return { data: mockBeatmap2 };
        return { error: "Not found" };
      },
    });

    const result = await capturedPaginationHandler({
      pageSize: 10,
      currentPage: 1,
      totalPages: 0,
    });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.title).toContain(gamemode);
    expect(result.data.title).toContain(scoreType);
    expect(result.data.description).toBeDefined();
  });

  it("should handle pagination callback with no scores", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    let capturedPaginationHandler: any = null;
    const paginationCreateMock = mock((interaction: any, handler: any, _state: any) => {
      capturedPaginationHandler = handler;
      return Promise.resolve();
    });
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    Mocker.mockApiRequests({
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
    });

    const result = await capturedPaginationHandler({
      pageSize: 10,
      currentPage: 1,
      totalPages: 0,
    });

    expect(result).toBeDefined();
    expect(result.data.description).toContain("No scores to show");
  });

  it("should handle pagination callback with API error", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.STANDARD;
    const scoreType = ScoreTableType.TOP;

    let capturedPaginationHandler: any = null;
    const paginationCreateMock = mock((interaction: any, handler: any, _state: any) => {
      capturedPaginationHandler = handler;
      return Promise.resolve();
    });
    container.utilities.pagination.createPaginationHandler = paginationCreateMock;

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            if (name === "type")
              return scoreType;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
        },
      }),
      "scores",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "scores",
    });

    Mocker.mockApiRequests({
      getUserByIdScores: async () => ({
        error: { error: "Scores API Error" },
      }),
    });

    const result = await capturedPaginationHandler({
      pageSize: 10,
      currentPage: 1,
      totalPages: 0,
    });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
});
