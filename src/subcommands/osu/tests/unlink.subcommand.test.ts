import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import type { jest } from "bun:test";
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { OsuCommand } from "../../../commands/osu.command";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";

describe("Osu Unlink Subcommand", () => {
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

  it("should successfully unlink account", async () => {
    const editReplyMock = mock();
    const currentUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        user: currentUser,
        options: {},
      }),
      "unlink",
    );

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: currentUser.id, $2: osuUserId.toString() });

    const beforeRow = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: currentUser.id }) as { osu_user_id: string } | null;
    expect(beforeRow).not.toBeNull();
    expect(beforeRow?.osu_user_id).toBe(osuUserId.toString());

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "unlink",
    });

    expect(errorHandler).not.toBeCalled();

    const expectedEmbed = container.utilities.embedPresets.getSuccessEmbed(
      `I successfully unlinked your account!`,
    );

    expect(editReplyMock).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          data: expect.objectContaining({
            title: expectedEmbed.data.title,
          }),
        }),
      ],
    });

    const afterRow = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: currentUser.id });

    expect(afterRow).toBeNull();
  });

  it("should throw error when user has no linked account", async () => {
    const currentUser = FakerGenerator.generateUser();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {},
      }),
      "unlink",
    );

    const { db } = container;
    const row = db.query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1").get({
      $1: currentUser.id,
    });
    expect(row).toBeNull();

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "unlink",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ You don't have any linked account",
      }),
      expect.anything(),
    );
  });

  it("should only unlink the current user's account", async () => {
    const user1 = FakerGenerator.generateUser();
    const user2 = FakerGenerator.generateUser();
    const osuUserId1 = faker.number.int({ min: 1, max: 1000000 });
    const osuUserId2 = faker.number.int({ min: 1, max: 1000000 });

    const { db } = container;

    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: user1.id, $2: osuUserId1.toString() });
    insertUser.run({ $1: user2.id, $2: osuUserId2.toString() });

    const beforeRow1 = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: user1.id }) as { osu_user_id: string } | null;
    const beforeRow2 = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: user2.id }) as { osu_user_id: string } | null;

    expect(beforeRow1).not.toBeNull();
    expect(beforeRow2).not.toBeNull();

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: user1,
        options: {},
      }),
      "unlink",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "unlink",
    });

    expect(errorHandler).not.toBeCalled();

    const afterRow1 = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: user1.id });
    expect(afterRow1).toBeNull();

    const afterRow2 = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: user2.id }) as { osu_user_id: string } | null;

    expect(afterRow2).not.toBeNull();
    expect(afterRow2?.osu_user_id).toBe(osuUserId2.toString());
  });

  it("should handle multiple unlink attempts gracefully", async () => {
    const currentUser = FakerGenerator.generateUser();
    const osuUserId = faker.number.int({ min: 1, max: 1000000 });

    const { db } = container;
    const insertUser = db.prepare(
      "INSERT INTO connections (discord_user_id, osu_user_id) VALUES ($1, $2)",
    );
    insertUser.run({ $1: currentUser.id, $2: osuUserId.toString() });

    const interaction1 = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {},
      }),
      "unlink",
    );

    await osuCommand.chatInputRun(interaction1, {
      commandId: faker.string.uuid(),
      commandName: "unlink",
    });

    expect(errorHandler).not.toBeCalled();

    const afterFirstUnlink = db
      .query("SELECT osu_user_id FROM connections WHERE discord_user_id = $1")
      .get({ $1: currentUser.id });
    expect(afterFirstUnlink).toBeNull();

    const interaction2 = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        user: currentUser,
        options: {},
      }),
      "unlink",
    );

    await osuCommand.chatInputRun(interaction2, {
      commandId: faker.string.uuid(),
      commandName: "unlink",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ You don't have any linked account",
      }),
      expect.anything(),
    );
  });
});
