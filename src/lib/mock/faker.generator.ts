import { faker } from "@faker-js/faker";
import type { Command } from "@sapphire/framework";
import { CommandStore, container } from "@sapphire/framework";
import type { DeepPartial } from "@sapphire/utilities";
import { jest, mock } from "bun:test";
import type {
  ApplicationCommand,
  ButtonInteraction,
  ModalSubmitInteraction,
  User,
} from "discord.js";
import {
  ApplicationCommandType,
  InteractionType,
  Locale,
  PermissionsBitField,
} from "discord.js";

import type {
  BeatmapResponse,
  CountryCode,
  ScoreResponse,
  UserResponse,
  UserStatsResponse,
  UserWithStats,
} from "../types/api";
import { BeatmapStatusWeb, GameMode } from "../types/api";
import type { PaginationStore } from "../types/store.types";
import { buildCustomId } from "../utils/discord.util";

function autoMock<T extends object>(base: Partial<T>): T {
  return new Proxy(base as T, {
    get(target: any, prop: string | symbol) {
      if (prop in target) {
        return target[prop];
      }

      return mock(async (..._args: any[]) => null);
    },
  }) as unknown as T;
}

function createBaseEntity() {
  return {
    id: faker.string.uuid(),
    createdAt: faker.date.past(),
    createdTimestamp: Date.now(),
  };
}

function createBaseInteraction() {
  return {
    ...createBaseEntity(),
    applicationId: faker.string.uuid(),
    channelId: faker.string.uuid(),
    guildId: faker.string.uuid(),
    locale: Locale.French,
  };
}

export const FakerGenerator = {
  generatePiece() {
    return {
      name: faker.string.alpha(10),
      store: container?.utilities?.store ?? {},
      path: faker.system.filePath(),
      root: faker.system.directoryPath(),
    };
  },

  generateLoaderContext() {
    return {
      name: faker.string.alpha(10),
      store: new CommandStore(),
      path: faker.system.filePath(),
      root: faker.system.directoryPath(),
    };
  },

  generateCustomId(
    options?: Partial<{
      prefix: string;
      userId: string;
      ctx: {
        dataStoreId?: string | undefined;
        data?: string[] | undefined;
      };
    }>,
  ) {
    return buildCustomId(
      options?.prefix ?? faker.lorem.word({ length: { min: 0, max: 10 } }),
      options?.userId ?? faker.number.int().toString(),
      {
        data: options?.ctx?.data ?? undefined,
        dataStoreId: options?.ctx?.dataStoreId ?? undefined,
      },
    );
  },

  generateInteraction(
    options?: DeepPartial<Command.ChatInputCommandInteraction>,
  ): Command.ChatInputCommandInteraction {
    return autoMock<Command.ChatInputCommandInteraction>({
      ...createBaseInteraction(),
      user: options?.user ?? FakerGenerator.generateUser(),
      commandType: ApplicationCommandType.ChatInput,
      type: InteractionType.ApplicationCommand,
      command: options?.command ?? FakerGenerator.generateCommand(),
      commandId: faker.string.uuid(),
      commandName: faker.lorem.words(2),
      commandGuildId: faker.string.uuid(),
      deferred: faker.datatype.boolean(),
      ephemeral: faker.datatype.boolean(),
      replied: faker.datatype.boolean(),
      ...(options as any),
    });
  },

  generateModalSubmitInteraction(
    options?: DeepPartial<ModalSubmitInteraction>,
  ): ModalSubmitInteraction {
    return autoMock<ModalSubmitInteraction>({
      ...createBaseInteraction(),
      user: options?.user ?? FakerGenerator.generateUser(),
      type: InteractionType.ModalSubmit,
      customId: faker.lorem.slug(),
      deferred: faker.datatype.boolean(),
      ephemeral: faker.datatype.boolean(),
      replied: faker.datatype.boolean(),
      ...(options as any),
    });
  },

  generateButtonInteraction(options?: DeepPartial<ButtonInteraction>): ButtonInteraction {
    return autoMock<ButtonInteraction>({
      ...createBaseInteraction(),
      user: options?.user ?? FakerGenerator.generateUser(),
      type: InteractionType.MessageComponent,
      customId: faker.lorem.slug(),
      deferred: faker.datatype.boolean(),
      ephemeral: faker.datatype.boolean(),
      replied: faker.datatype.boolean(),
      ...(options as any),
    });
  },

  withSubcommand<T extends Command.ChatInputCommandInteraction>(
    interaction: T,
    subcommand: string,
  ): T {
    interaction.options.getSubcommand = jest.fn().mockReturnValue(subcommand);
    interaction.options.getSubcommandGroup = jest.fn().mockReturnValue(null);

    return interaction;
  },

  generateCommand(options?: DeepPartial<ApplicationCommand<object>>): ApplicationCommand<object> {
    return autoMock<ApplicationCommand<object>>({
      ...createBaseEntity(),
      applicationId: faker.string.uuid(),
      guildId: faker.string.uuid(),
      type: ApplicationCommandType.ChatInput,
      version: `v${faker.number.int({ min: 1, max: 100 })}`,
      client: container.client as any,
      defaultMemberPermissions: new PermissionsBitField(PermissionsBitField.Flags.SendMessages),
      description: faker.lorem.sentence(),
      ...(options as any),
    });
  },

  generateUser(options?: DeepPartial<User>): User {
    const userId = options?.id ?? faker.string.uuid();
    const username = options?.username ?? faker.internet.username();

    return autoMock<User>({
      ...createBaseEntity(),
      id: userId,
      username,
      discriminator: faker.string.numeric(4),
      bot: faker.datatype.boolean(),
      system: false,
      displayName: username,
      defaultAvatarURL: faker.internet.url(),
      tag: `${username}#${faker.string.numeric(4)}`,
      client: container.client as any,
      avatarURL: () => faker.internet.url(),
      displayAvatarURL: () => faker.internet.url(),
      toString: () => `<@${userId}>`,
      ...(options as any),
    });
  },

  generatePaginationData(options?: DeepPartial<PaginationStore>): PaginationStore {
    return autoMock<PaginationStore>({
      handleSetPage:
        options?.handleSetPage ?? mock(async (_state: any) => ({ embed: {}, buttonsRow: {} })),
      state: {
        pageSize: options?.state?.pageSize ?? 10,
        totalPages: options?.state?.totalPages ?? 5,
        currentPage: options?.state?.currentPage ?? 1,
        ...(options?.state as any),
      },
      ...(options as any),
    });
  },

  generateOsuUser(options?: Partial<UserResponse>): UserResponse {
    return {
      user_id: faker.number.int({ min: 1, max: 1000000 }),
      username: faker.internet.username(),
      country_code: faker.location.countryCode() as CountryCode,
      avatar_url: "https://placehold.co/400x400",
      banner_url: "https://placehold.co/1200x300",
      register_date: new Date().toISOString(),
      last_online_time: new Date().toISOString(),
      restricted: false,
      silenced_until: null,
      default_gamemode: GameMode.STANDARD,
      badges: [],
      user_status: "online",
      description: null,
      ...options,
    };
  },

  generateScore(options?: Partial<ScoreResponse>): ScoreResponse {
    const mockUser = options?.user ?? FakerGenerator.generateOsuUser();

    return {
      id: faker.number.int({ min: 1, max: 1000000 }),
      beatmap_id: faker.number.int({ min: 1, max: 1000000 }),
      user_id: mockUser.user_id,
      user: mockUser,
      total_score: faker.number.int({ min: 1000000, max: 100000000 }),
      max_combo: faker.number.int({ min: 100, max: 2000 }),
      count_300: faker.number.int({ min: 100, max: 1000 }),
      count_100: faker.number.int({ min: 10, max: 100 }),
      count_50: faker.number.int({ min: 0, max: 50 }),
      count_miss: faker.number.int({ min: 0, max: 10 }),
      count_geki: faker.number.int({ min: 0, max: 100 }),
      count_katu: faker.number.int({ min: 0, max: 100 }),
      performance_points: faker.number.float({ min: 100, max: 1000 }),
      grade: ["S", "A", "B", "C", "D", "F"][faker.number.int({ min: 0, max: 5 })] as string,
      accuracy: faker.number.float({ min: 90, max: 100 }),
      game_mode: GameMode.STANDARD,
      game_mode_extended: GameMode.STANDARD,
      is_passed: true,
      has_replay: true,
      is_perfect: false,
      when_played: new Date().toISOString(),
      mods: null,
      mods_int: 0,
      leaderboard_rank: null,
      ...options,
    };
  },

  generateBeatmap(options?: Partial<BeatmapResponse>): BeatmapResponse {
    return {
      id: faker.number.int({ min: 1, max: 1000000 }),
      beatmapset_id: faker.number.int({ min: 1, max: 100000 }),
      hash: faker.string.alphanumeric(32),
      version: faker.word.adjective(),
      status: BeatmapStatusWeb.RANKED,
      star_rating_osu: faker.number.float({ min: 1, max: 10 }),
      star_rating_taiko: faker.number.float({ min: 1, max: 10 }),
      star_rating_ctb: faker.number.float({ min: 1, max: 10 }),
      star_rating_mania: faker.number.float({ min: 1, max: 10 }),
      total_length: faker.number.int({ min: 60, max: 600 }),
      max_combo: faker.number.int({ min: 100, max: 2000 }),
      accuracy: faker.number.float({ min: 1, max: 10 }),
      ar: faker.number.float({ min: 1, max: 10 }),
      bpm: faker.number.float({ min: 80, max: 200 }),
      convert: false,
      count_circles: faker.number.int({ min: 100, max: 1000 }),
      count_sliders: faker.number.int({ min: 50, max: 500 }),
      count_spinners: faker.number.int({ min: 0, max: 10 }),
      cs: faker.number.float({ min: 1, max: 10 }),
      deleted_at: null,
      drain: faker.number.float({ min: 1, max: 10 }),
      hit_length: faker.number.int({ min: 60, max: 600 }),
      is_scoreable: true,
      is_ranked: true,
      last_updated: new Date().toISOString(),
      mode_int: 0,
      mode: GameMode.STANDARD,
      ranked: 1,
      title: faker.music.songName(),
      artist: faker.person.fullName(),
      creator: faker.internet.username(),
      creator_id: faker.number.int({ min: 1, max: 100000 }),
      beatmap_nominator_user: undefined,
      ...options,
    };
  },

  generateUserStats(options?: Partial<UserStatsResponse>): UserStatsResponse {
    const userId = options?.user_id ?? faker.number.int({ min: 1, max: 1000000 });

    return {
      user_id: userId,
      gamemode: GameMode.STANDARD,
      accuracy: faker.number.float({ min: 85, max: 100 }),
      total_score: faker.number.int({ min: 1000000, max: 1000000000 }),
      ranked_score: faker.number.int({ min: 1000000, max: 100000000 }),
      play_count: faker.number.int({ min: 100, max: 10000 }),
      pp: faker.number.float({ min: 1000, max: 10000 }),
      rank: faker.number.int({ min: 1, max: 100000 }),
      country_rank: faker.number.int({ min: 1, max: 10000 }),
      max_combo: faker.number.int({ min: 500, max: 5000 }),
      play_time: faker.number.int({ min: 10000, max: 1000000 }),
      total_hits: faker.number.int({ min: 10000, max: 1000000 }),
      best_global_rank: faker.number.int({ min: 1, max: 50000 }),
      best_global_rank_date: new Date().toISOString(),
      best_country_rank: faker.number.int({ min: 1, max: 5000 }),
      best_country_rank_date: new Date().toISOString(),
      ...options,
    };
  },

  generateUserWithStats(options?: {
    user?: Partial<UserResponse>;
    stats?: Partial<UserStatsResponse>;
  }): UserWithStats {
    const user = FakerGenerator.generateOsuUser(options?.user);
    const stats = FakerGenerator.generateUserStats({
      user_id: user.user_id,
      ...options?.stats,
    });

    return {
      user,
      stats,
    };
  },
};
