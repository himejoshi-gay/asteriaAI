import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { ButtonStyle } from "discord.js";

import { OsuCommand } from "../../../commands/osu.command";
import { FakerGenerator } from "../../../lib/mock/faker.generator";
import { Mocker } from "../../../lib/mock/mocker";

describe("Osu Score Subcommand", () => {
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

  it("should display score embed when score ID is provided", async () => {
    const editReplyMock = mock();
    const scoreId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore({ id: scoreId });
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn().mockReturnValue(scoreId.toString()),
        },
      }),
      "score",
    );

    Mocker.mockApiRequests({
      getScoreById: async () => ({
        data: mockScore,
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
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

  it("should handle score link with sunrise URI", async () => {
    const editReplyMock = mock();
    const scoreId = faker.number.int({ min: 1, max: 1000000 });
    const sunriseUri = container.config.sunrise.uri;
    const scoreLink = `https://${sunriseUri}/score/${scoreId}`;

    const mockScore = FakerGenerator.generateScore({ id: scoreId });
    const mockBeatmap = FakerGenerator.generateBeatmap({ id: mockScore.beatmap_id });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: editReplyMock,
        options: {
          getString: jest.fn().mockReturnValue(scoreLink),
        },
      }),
      "score",
    );

    Mocker.mockApiRequests({
      getScoreById: async () => ({
        data: mockScore,
      }),
      getBeatmapById: async () => ({
        data: mockBeatmap,
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
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
                url: `https://${sunriseUri}/score/${scoreId}`,
              }),
            }),
          ],
        }),
      ],
    });
  });

  it("should throw error when invalid score ID is provided", async () => {
    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue("invalid"),
        },
      }),
      "score",
    );

    Mocker.mockApiRequests({
      getScoreById: async () => ({
        error: "Score not found",
      }),
      getBeatmapById: async () => ({
        error: "Beatmap not found",
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find score with such data",
      }),
      expect.anything(),
    );
  });

  it("should throw error when no score ID is provided", async () => {
    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(null),
        },
      }),
      "score",
    );

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ Bad score id/link is provided",
      }),
      expect.anything(),
    );
  });

  it("should throw error when score is not found", async () => {
    const scoreId = faker.number.int({ min: 1, max: 1000000 });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(scoreId.toString()),
        },
      }),
      "score",
    );

    Mocker.mockApiRequest("getScoreById", async () => ({
      error: "Score not found",
    }));

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't find score with such data",
      }),
      expect.anything(),
    );
  });

  it("should throw error when beatmap is not found", async () => {
    const scoreId = faker.number.int({ min: 1, max: 1000000 });

    const mockScore = FakerGenerator.generateScore({ id: scoreId });

    const interaction = FakerGenerator.withSubcommand(
      FakerGenerator.generateInteraction({
        deferReply: mock(),
        editReply: mock(),
        options: {
          getString: jest.fn().mockReturnValue(scoreId.toString()),
        },
      }),
      "score",
    );

    Mocker.mockApiRequests({
      getScoreById: async () => ({
        data: mockScore,
      }),
      getBeatmapById: async () => ({
        error: "Beatmap not found",
      }),
    });

    await osuCommand.chatInputRun(interaction, {
      commandId: faker.string.uuid(),
      commandName: "score",
    });

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "❓ I couldn't fetch score's beatmap data",
      }),
      expect.anything(),
    );
  });
});
