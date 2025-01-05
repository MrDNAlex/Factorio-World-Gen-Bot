"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = require("discord.js");
const FactorioServerManager_1 = __importDefault(require("./FactorioServer/FactorioServerManager"));
class FactorioServerBotDataManager extends dna_discord_framework_1.BotDataManager {
    constructor() {
        //Current World Files
        super(...arguments);
        /**
         * Factorio Server Manager
         */
        this.SERVER_MANAGER = new FactorioServerManager_1.default();
        this.WORLD_CHANNEL_SET = false;
        this.WORLD_CHANNEL_ID = "";
        this.LAST_BACKUP_DATE = 0;
        this.SERVER_PORT = 8213;
        this.BOT_SETUP = false;
    }
    CreateDirectories() {
        const world = "/home/factorio/World";
        const previews = "/home/factorio/Previews";
        const backups = "/home/factorio/Backups";
        const extras = "/home/factorio/Backups/Extras";
        const worldUpload = "/home/factorio/WorldUpload";
        if (!fs_1.default.existsSync(world))
            fs_1.default.mkdirSync(world, { recursive: true });
        if (!fs_1.default.existsSync(previews))
            fs_1.default.mkdirSync(previews, { recursive: true });
        if (!fs_1.default.existsSync(backups))
            fs_1.default.mkdirSync(backups, { recursive: true });
        if (!fs_1.default.existsSync(extras))
            fs_1.default.mkdirSync(extras, { recursive: true });
        if (!fs_1.default.existsSync(worldUpload))
            fs_1.default.mkdirSync(worldUpload, { recursive: true });
    }
    SetActivity(client) {
        if (!client.user)
            return;
        if (this.BOT_SETUP)
            client.user.setActivity("Creator of Factorio Worlds", { type: discord_js_1.ActivityType.Playing });
        else
            client.user.setActivity("Waiting for Bot Setup, check /help", { type: discord_js_1.ActivityType.Custom });
    }
}
exports.default = FactorioServerBotDataManager;
