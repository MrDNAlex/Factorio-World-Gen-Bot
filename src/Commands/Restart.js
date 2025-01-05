"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
class Restart extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "restart";
        this.CommandDescription = "Restarts the Factorio server";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
            let serverManager = dataManager.SERVER_MANAGER;
            dataManager.Update();
            if (!(await serverManager.IsOnline()))
                return this.AddToMessage("Server is not Running, cannot Restart.");
            this.AddToMessage("Shutting Down Server...");
            let shutdownStatus = await serverManager.Shutdown();
            dataManager.ServerOffline(client);
            // Secretly Backup the Server
            await serverManager.Backup();
            if (!shutdownStatus || await serverManager.IsOnline())
                return this.AddToMessage("Error Shutting Down Server. Please Check the Logs for more Information.");
            this.AddToMessage("Server Shutdown! Waiting a Few Seconds to Restart...");
            await new Promise(resolve => setTimeout(resolve, serverManager.ActionWaitTime));
            this.AddToMessage(`Starting Server...`);
            let startStatus = await serverManager.Start();
            if (!startStatus || !(await serverManager.IsOnline()))
                return this.AddToMessage("Error Starting Server. Please Check the Logs for more Information.");
            this.AddToMessage("Server Started!");
            this.AddToMessage("Connect to the Server using the Following Connection Info:");
            this.AddToMessage("```" + connectionInfo + "```");
            dataManager.ServerOnline(client);
        };
    }
}
module.exports = Restart;
