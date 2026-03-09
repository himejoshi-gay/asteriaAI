import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { ButtonStyle } from "discord.js";

import { OsuCommand } from "../../../commands/osu.command";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";
import { GameMode } from "../../../lib/types/api";

describe("Osu Recent Score Subcommand", () => {
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

  it("should display recent score when username is provided", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore();
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
      getUserByIdScores: async () => ({
        data: { scores: [mockScore], total_count: 1 },
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).not.toBeCalled();

    const scoreEmbed = await osuCommand.container.utilities.embedPresets.getScoreEmbed(
      mockScore,
      mockBeatmap,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: scoreEmbed.data,
        }),
      ],
      components: [
        expect.objectContaining({
          components: [
            expect.objectContaining({
              data: expect.objectContaining({
                style: ButtonStyle.Link,
                label: "View score online",
              }),
            }),
          ],
        }),
      ],
    });
  });

  it("should display recent score when Discord user is provided (linked account)", async () => {
    const editReplyMock = mock();
    const discordUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore();
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(discordUser),
        },
      }),
      "rs",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: discordUser.id, $2: osuUserId.toString() });

    Mocker.mockApiRequests({
      getUserByIdScores: async () => ({
        data: { scores: [mockScore], total_count: 1 },
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).not.toBeCalled();

    const scoreEmbed = await osuCommand.container.utilities.embedPresets.getScoreEmbed(
      mockScore,
      mockBeatmap,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: scoreEmbed.data,
        }),
      ],
      components: [
        expect.objectContaining({
          components: [
            expect.objectContaining({
              data: expect.objectContaining({
                style: ButtonStyle.Link,
                label: "View score online",
              }),
            }),
          ],
        }),
      ],
    });
  });

  it("should display recent score for current user (no options, linked account)", async () => {
    const editReplyMock = mock();
    const currentUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore();
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        user: currentUser,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: currentUser.id, $2: osuUserId.toString() });

    Mocker.mockApiRequests({
      getUserByIdScores: async () => ({
        data: { scores: [mockScore], total_count: 1 },
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).not.toBeCalled();

    const scoreEmbed = await osuCommand.container.utilities.embedPresets.getScoreEmbed(
      mockScore,
      mockBeatmap,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: scoreEmbed.data,
        }),
      ],
      components: [
        expect.objectContaining({
          components: [
            expect.objectContaining({
              data: expect.objectContaining({
                style: ButtonStyle.Link,
                label: "View score online",
              }),
            }),
          ],
        }),
      ],
    });
  });

  it("should display recent score with specific gamemode", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.TAIKO;

    const mockScore = FakerGenerator.generateScore({ game_mode: gamemode });
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) => {
            if (name === "username")
              return username;
            if (name === "gamemode")
              return gamemode;
            return null;
          }),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
      getUserByIdScores: async () => ({
        data: { scores: [mockScore], total_count: 1 },
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).not.toBeCalled();

    const scoreEmbed = await osuCommand.container.utilities.embedPresets.getScoreEmbed(
      mockScore,
      mockBeatmap,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: scoreEmbed.data,
        }),
      ],
      components: expect.anything(),
    });
  });

  it("should throw error when username is not found", async () => {
    const username = faker.internet.username();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
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

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(discordUser),
        },
      }),
      "rs",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
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

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ Provided user didn't link their himejoshi account",
      }),
      expect.anything(),
    );
  });

  it("should throw error when user has no recent scores", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "This user has no recent scores",
      }),
      expect.anything(),
    );
  });

  it("should throw error when beatmap is not found", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
      getUserByIdScores: async () => ({
        data: { scores: [mockScore], total_count: 1 },
      }),
      getBeatmapById: async () => ({
        error: "Beatmap not found",
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't fetch score's beatmap data",
      }),
      expect.anything(),
    );
  });

  it("should throw error when username search API fails", async () => {
    const username = faker.internet.username();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        error: { error: "API Error" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find user with such username",
      }),
      expect.anything(),
    );
  });

  it("should throw error when recent scores API fails", async () => {
    const username = faker.internet.username();
    const userId = faker.number.int({ min: 1, max: 1000000 });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "rs",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userId, username }],
      }),
      getUserByIdScores: async () => ({
        error: { error: "Scores API Error" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "rs",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Couldn't fetch requested user's recent score!",
      }),
      expect.anything(),
    );
  });
});
