"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
class Shutdown extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "shutdown";
        this.CommandDescription = "Shutsdown the Server that is running";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = true;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let serverManager = dataManager.SERVER_MANAGER;
            dataManager.Update();
            if (!(await serverManager.IsOnline()))
                return this.AddToMessage("Server is not Running, Nothing to Shutdown");
            this.AddToMessage("Shutting Down Server...");
            // Secretly Backup the Server
            await serverManager.Backup();
            await serverManager.Shutdown();
            dataManager.ServerOffline(client);
            if (!(await serverManager.IsOnline()))
                return this.AddToMessage("Server is Offline.");
            this.AddToMessage("Error Shutting Down Server.");
            this.AddToMessage("Server is still Online.");
        };
    }
}
module.exports = Shutdown;
