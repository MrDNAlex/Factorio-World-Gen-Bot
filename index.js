"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("./src/FactorioServerBotDataManager"));
const FactorioServerManager_1 = __importDefault(require("./src/FactorioServer/FactorioServerManager"));
const Bot = new dna_discord_framework_1.DiscordBot(FactorioServerBotDataManager_1.default);
Bot.StartBot();
let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
dataManager.CreateDirectories();
dataManager.SERVER_MANAGER = new FactorioServerManager_1.default(dataManager.SERVER_MANAGER);
setTimeout(() => dataManager.SetupActivity(Bot.BotInstance), 3000);
console.log("Bot Started");
FactorioServerManager_1.default.AutoBackup();
