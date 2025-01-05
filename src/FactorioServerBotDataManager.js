"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const fs_1 = __importDefault(require("fs"));
const FactorioServerManager_1 = __importDefault(require("./FactorioServer/FactorioServerManager"));
const discord_js_1 = require("discord.js");
class FactorioServerBotDataManager extends dna_discord_framework_1.BotDataManager {
    constructor() {
        //Current World Files
        super(...arguments);
        /**
         * Factorio Server Manager
         */
        this.SERVER_MANAGER = new FactorioServerManager_1.default();
        /**
         * Boolean Flag Indicating if a World has been Chosen
         */
        this.WORLD_CHOSEN = false;
        // The Default Port to Expose
        this.SERVER_PORT = 8213;
        //Server Host name / IP Address
        this.SERVER_HOSTNAME = "";
        this.WORLD_CHANNEL_SET = false;
        this.WORLD_CHANNEL_ID = "";
        this.LAST_BACKUP_DATE = 0;
        this.BOT_SETUP = false;
    }
    CreateDirectories() {
        const world = "/home/factorio/World";
        const previews = "/home/factorio/Previews";
        const backups = "/home/factorio/Backups";
        const extras = "/home/factorio/Backups/Extras";
        if (!fs_1.default.existsSync(world))
            fs_1.default.mkdirSync(world, { recursive: true });
        if (!fs_1.default.existsSync(previews))
            fs_1.default.mkdirSync(previews, { recursive: true });
        if (!fs_1.default.existsSync(backups))
            fs_1.default.mkdirSync(backups, { recursive: true });
        if (!fs_1.default.existsSync(extras))
            fs_1.default.mkdirSync(extras, { recursive: true });
    }
    Update() {
        this.SERVER_MANAGER.PlayerDB.Update();
        this.SERVER_MANAGER.SaveWorldInfo(true);
        this.SaveData();
    }
    async SetupActivity(client) {
        if (!client.user)
            return;
        if (this.BOT_SETUP)
            return this.ServerOffline(client);
        client.user.setActivity("Waiting for Bot Setup, check /help", { type: discord_js_1.ActivityType.Custom });
    }
    async ServerOffline(client) {
        if (!client.user)
            return;
        if (await this.SERVER_MANAGER.IsOnline()) {
            this.ServerOnline(client);
            return;
        }
        if (this.WORLD_CHOSEN)
            client.user.setActivity("Waiting for Server to Start ", { type: discord_js_1.ActivityType.Custom });
        else
            client.user.setActivity("Waiting for World to be Chosen", { type: discord_js_1.ActivityType.Custom });
    }
    async ServerOnline(client) {
        if (!client.user)
            return;
        if (!(await this.SERVER_MANAGER.IsOnline())) {
            this.ServerOffline(client);
            return;
        }
        client.user.setActivity("Factorio Server", { type: discord_js_1.ActivityType.Playing });
    }
}
exports.default = FactorioServerBotDataManager;
