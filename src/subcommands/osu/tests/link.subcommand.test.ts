import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  mock,
} from "bun:test";

import { OsuCommand } from "../../../commands/osu.command";
import { ExtendedError } from "../../../lib/extended-error";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";

describe("Osu Link Subcommand", () => {
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

  it("should reply with success message when link is successful with username", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) =>
            name === "username" ? username : null,
          ),
        },
      }),
      "link",
    );

    const osuUserId = faker.number.int({ min: 1, max: 1000000 });

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [{ user_id: osuUserId, username }],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    const expectedEmbed = container.utilities.embedPresets.getSuccessEmbed(
      `🙂 You are now **${username}**!`,
    );

    expect(errorHandler).not.toBeCalled();

    expect(editReplyMock).toHaveBeenLastCalledWith({
      embeds: [
        expect.objectContaining({
          data: expect.objectContaining({
            title: expectedEmbed.data.title,
          }),
        }),
      ],
    });

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toEqual({ osu_user_id: osuUserId.toString() });
  });

  it("should reply with success message when link is successful with id", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userIdString = osuUserId.toString();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) =>
            name === "id" ? userIdString : null,
          ),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserById: async () => ({
        data: { user_id: osuUserId, username },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    const expectedEmbed = container.utilities.embedPresets.getSuccessEmbed(
      `🙂 You are now **${username}**!`,
    );

    expect(errorHandler).not.toBeCalled();

    expect(editReplyMock).toHaveBeenLastCalledWith({
      embeds: [
        expect.objectContaining({
          data: expect.objectContaining({
            title: expectedEmbed.data.title,
          }),
        }),
      ],
    });

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toEqual({ osu_user_id: osuUserId.toString() });
  });

  it("should prioritize id over username when both are provided", async () => {
    const editReplyMock = mock();
    const username = faker.internet.username();
    const otherUsername = faker.internet.username();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userIdString = osuUserId.toString();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn((name: string) => {
            if (name === "id")
              return userIdString;
            if (name === "username")
              return otherUsername;
            return null;
          }),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserById: async () => ({
        data: { user_id: osuUserId, username },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    const expectedEmbed = container.utilities.embedPresets.getSuccessEmbed(
      `🙂 You are now **${username}**!`,
    );

    expect(errorHandler).not.toBeCalled();

    expect(editReplyMock).toHaveBeenLastCalledWith({
      embeds: [
        expect.objectContaining({
          data: expect.objectContaining({
            title: expectedEmbed.data.title,
          }),
        }),
      ],
    });

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toEqual({ osu_user_id: osuUserId.toString() });
  });

  it("should throw error when neither username nor id is provided", async () => {
    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(null),
        },
      }),
      "link",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "You must provide either a username or an ID to link your account.",
      }),
      expect.anything(),
    );

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toBeNull();
  });

  it("should reply with error message when username search fails", async () => {
    const username = faker.internet.username();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) =>
            name === "username" ? username : null,
          ),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        error: { detail: "User not found", title: "Not Found" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(ExtendedError),
      expect.anything(),
    );

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toBeNull();
  });

  it("should reply with error message when username search returns empty array", async () => {
    const username = faker.internet.username();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) =>
            name === "username" ? username : null,
          ),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserSearch: async () => ({
        data: [],
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(ExtendedError),
      expect.anything(),
    );

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toBeNull();
  });

  it("should reply with error message when getUserById fails", async () => {
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userIdString = osuUserId.toString();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) =>
            name === "id" ? userIdString : null,
          ),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserById: async () => ({
        error: { detail: "User not found", title: "Not Found" },
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(ExtendedError),
      expect.anything(),
    );

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toBeNull();
  });

  it("should reply with error message when getUserById returns no data", async () => {
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });
    const userIdString = osuUserId.toString();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn((name: string) =>
            name === "id" ? userIdString : null,
          ),
        },
      }),
      "link",
    );

    Mocker.mockApiRequests({
      getUserById: async () => ({
        data: null,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "link",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(ExtendedError),
      expect.anything(),
    );

    const { db } = container;

    const row = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({
        $1: interaction.user.id,
      });

    expect(row).toBeNull();
  });
});
