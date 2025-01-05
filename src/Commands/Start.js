"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const FactorioServerManager_1 = __importDefault(require("../FactorioServer/FactorioServerManager"));
const fs_1 = __importDefault(require("fs"));
class Start extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "start";
        this.CommandDescription = "Starts the Factorio server";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
            let serverManager = dataManager.SERVER_MANAGER;
            if (!fs_1.default.existsSync(FactorioServerManager_1.default.WorldFilePath))
                return this.AddToMessage("No World File Found. You can Generate a World using `/genworld` or Load a Backup using `/loadbackup`.");
            if (await serverManager.IsOnline())
                return this.AddToMessage("Server is already Running.");
            dataManager.Update();
            this.AddToMessage(`Starting Server...`);
            let startStatus = await serverManager.Start();
            if (!startStatus || !(await serverManager.IsOnline()))
                return this.AddToMessage("Error Starting Server. Please Check the Logs for more Information.");
            this.AddToMessage("Server Started!");
            this.AddToMessage("Connect to the Server using the Following Connection Info:");
            this.AddToMessage("```" + connectionInfo + "```");
            dataManager.WORLD_CHOSEN = true;
            dataManager.ServerOnline(client);
        };
    }
}
module.exports = Start;
