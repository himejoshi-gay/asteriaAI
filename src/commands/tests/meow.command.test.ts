import type { jest } from "bun:test";
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { FakerGenerator } from "../../lib/mock/faker.generator";
import { Mocker } from "../../lib/mock/mocker";
import { MeowCommand } from "../meow.command";

describe("Meow Command", () => {
  let meowCommand: MeowCommand;
  let errorHandler: jest.Mock;

  beforeAll(() => {
    Mocker.createSapphireClientInstance();
    meowCommand = Mocker.createCommandInstance(MeowCommand);
    errorHandler = Mocker.createErrorHandler();
  });

  afterAll(async () => {
    await Mocker.resetSapphireClientInstance();
  });

  beforeEach(() => Mocker.beforeEachCleanup(errorHandler));

  it("should reply with 'meow! 😺' when chatInputRun is called", async () => {
    const replyMock = mock();
    const interaction = FakerGenerator.generateInteraction({
      reply: replyMock,
    });

    await meowCommand.chatInputRun(interaction);

    expect(errorHandler).not.toBeCalled();

    expect(replyMock).toHaveBeenCalledWith("meow! 😺");
  });
});
