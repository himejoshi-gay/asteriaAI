import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-utilities-store/register";

import { SunshineClient } from "./client";
import { config } from "./lib/configs/env";

const client = new SunshineClient();
client.login(config.discord.token);
