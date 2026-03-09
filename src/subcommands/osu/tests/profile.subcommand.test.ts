import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";

import { OsuCommand } from "../../../commands/osu.command";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";
import { GameMode } from "../../../lib/types/api";

describe("Osu Profile Subcommand", () => {
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

  it("should display profile when username is provided", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();
    const userWithStats = FakerGenerator.generateUserWithStats({
      user: { username },
    });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: userWithStats.user.user_id, username }],
      }),
      getUserByIdByMode: async () => ({
        data: userWithStats,
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
      getUserByIdGrades: async () => ({
        data: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).not.toBeCalled();

    const userEmbed = await osuCommand.container.utilities.embedPresets.getUserEmbed(
      userWithStats.user,
      userWithStats.stats,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: userEmbed.data,
        }),
      ],
    });
  });

  it("should display profile when user ID is provided", async () => {
    const editReplyMock = mock();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const userWithStats = FakerGenerator.generateUserWithStats({
      user: { user_id: userId },
    });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(userId),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserByIdByMode: async () => ({
        data: userWithStats,
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
      getUserByIdGrades: async () => ({
        data: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).not.toBeCalled();

    const userEmbed = await osuCommand.container.utilities.embedPresets.getUserEmbed(
      userWithStats.user,
      userWithStats.stats,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: userEmbed.data,
        }),
      ],
    });
  });

  it("should display profile when Discord user is provided (linked account)", async () => {
    const editReplyMock = mock();
    const discordUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userWithStats = FakerGenerator.generateUserWithStats({
      user: { user_id: osuUserId },
    });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(discordUser),
        },
      }),
      "profile",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: discordUser.id, $2: osuUserId.toString() });

    Mocker.mockApiRequests({
      getUserByIdByMode: async () => ({
        data: userWithStats,
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
      getUserByIdGrades: async () => ({
        data: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).not.toBeCalled();

    const userEmbed = await osuCommand.container.utilities.embedPresets.getUserEmbed(
      userWithStats.user,
      userWithStats.stats,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: userEmbed.data,
        }),
      ],
    });
  });

  it("should display profile for current user (no options, linked account)", async () => {
    const editReplyMock = mock();
    const currentUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userWithStats = FakerGenerator.generateUserWithStats({
      user: { user_id: osuUserId },
    });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        user: currentUser,
        options: {
          getString: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    const { db } = container;
    const insertStmt = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertStmt.run({ $1: currentUser.id, $2: osuUserId.toString() });

    Mocker.mockApiRequests({
      getUserByIdByMode: async () => ({
        data: userWithStats,
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
      getUserByIdGrades: async () => ({
        data: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).not.toBeCalled();

    const userEmbed = await osuCommand.container.utilities.embedPresets.getUserEmbed(
      userWithStats.user,
      userWithStats.stats,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: userEmbed.data,
        }),
      ],
    });
  });

  it("should display profile with specific gamemode", async () => {
    const editReplyMock = mock();
    const userId = faker.number.int({ min: 1, max: 1000000 });
    const gamemode = GameMode.TAIKO;
    const userWithStats = FakerGenerator.generateUserWithStats({
      user: { user_id: userId },
      stats: { gamemode },
    });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) => (name === "gamemode" ? gamemode : null)),
          getNumber: jest.fn().mockReturnValue(userId),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserByIdByMode: async () => ({
        data: userWithStats,
      }),
      getUserByIdScores: async () => ({
        data: { scores: [], total_count: 0 },
      }),
      getUserByIdGrades: async () => ({
        data: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).not.toBeCalled();

    const userEmbed = await osuCommand.container.utilities.embedPresets.getUserEmbed(
      userWithStats.user,
      userWithStats.stats,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: userEmbed.data,
        }),
      ],
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
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find user with such username",
      }),
      expect.anything(),
    );
  });

  it("should throw error when user ID is not found", async () => {
    const userId = faker.number.int({ min: 1, max: 1000000 });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(null),
          getNumber: jest.fn().mockReturnValue(userId),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserByIdByMode: async () => ({
        error: { error: "User not found" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Couldn't fetch requested user!",
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
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(discordUser),
        },
      }),
      "profile",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
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
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
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

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) => (name === "username" ? username : null)),
          getNumber: jest.fn().mockReturnValue(null),
          getUser: jest.fn().mockReturnValue(null),
        },
      }),
      "profile",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        error: { error: "API Error" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "profile",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find user with such username",
      }),
      expect.anything(),
    );
  });
});
