import path from "node:path";

import { faker } from "@faker-js/faker";
import type { Command } from "@sapphire/framework";
import { container, Events, LogLevel, SapphireClient } from "@sapphire/framework";
import { SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { UtilitiesStore } from "@sapphire/plugin-utilities-store";
import { Database } from "bun:sqlite";
import type { jest } from "bun:test";
import { mock } from "bun:test";
import { getMigrations, migrate } from "bun-sqlite-migrations";
import { IntentsBitField } from "discord.js";

import { ActionStoreUtility } from "../../utilities/action-store.utility";
import { EmbedPresetsUtility } from "../../utilities/embed-presets.utility";
import { PaginationUtility } from "../../utilities/pagination.utility";
import { config } from "../configs/env";
import { FakerGenerator } from "./faker.generator";

export class Mocker {
  static createSapphireClientInstance() {
    const client = new SapphireClient({
      intents: new IntentsBitField().add(IntentsBitField.Flags.Guilds),
      logger: { level: LogLevel.Debug },
    });

    container.client = client;

    container.logger = {
      trace: mock(),
      write: mock(),
      fatal: mock(),
      debug: mock(),
      info: mock(),
      warn: mock(),
      error: mock(),
      has: mock((level: LogLevel) => level === LogLevel.Debug),
    };

    const store = new UtilitiesStore();
    container.utilities = {
      ...container.utilities,
      store,
      actionStore: new ActionStoreUtility(FakerGenerator.generatePiece()),
      embedPresets: new EmbedPresetsUtility(FakerGenerator.generatePiece(), {}),
      pagination: new PaginationUtility(FakerGenerator.generatePiece(), {}),
      exposePiece(name, piece) {
        store.set(name, piece);
      },
    };

    container.config = {
      ...config,
      sunrise: { uri: "sunrise.example.com" },
    };

    this.createDatabaseInMemory();
  }

  static async resetSapphireClientInstance() {
    await container.client.destroy();
    container.db.close();
    this.createDatabaseInMemory();
  }

  static beforeEachCleanup(errorHandler: jest.Mock) {
    errorHandler.mockClear();
    Mocker.resetDatabase();
  }

  private static resetDatabase() {
    const tables = container.db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;

    for (const table of tables) {
      if (table.name !== "sqlite_sequence") {
        container.db.exec(`DELETE FROM ${table.name}`);
      }
    }
  }

  static createCommandInstance<T extends Command>(CommandClass: new (...args: any[]) => T): T {
    return new CommandClass(
      {
        name: faker.word.adjective(),
        path: faker.system.filePath(),
        root: faker.system.directoryPath(),
        store: container.utilities.store,
      },
      {},
    );
  }

  static createErrorHandler() {
    const errorHandler = mock();
    container.client.on(Events.ChatInputCommandError, errorHandler);
    container.client.on(SubcommandPluginEvents.ChatInputSubcommandError, errorHandler);
    return errorHandler;
  }

  static mockApiRequest<T>(
    mockedEndpointMethod: keyof T,
    implementation: (...args: any[]) => Promise<any>,
  ) {
    mock.module(path.resolve(process.cwd(), "src", "lib", "types", "api"), () => ({
      [mockedEndpointMethod]: implementation,
    }));
  }

  static mockApiRequests<T extends Record<string, (...args: any[]) => Promise<any>>>(mocks: T) {
    mock.module(path.resolve(process.cwd(), "src", "lib", "types", "api"), () => mocks);
  }

  private static createDatabaseInMemory() {
    if (!container) {
      throw new Error("Container is not initialized");
    }
    container.db = new Database(":memory:");
    migrate(container.db, getMigrations(path.resolve(process.cwd(), "data", "migrations")));
  }
}
