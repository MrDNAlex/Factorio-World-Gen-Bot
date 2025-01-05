"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
class Join extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "join";
        this.CommandDescription = "Sends the Join Info for the Factorio Server";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
            let serverManager = dataManager.SERVER_MANAGER;
            dataManager.Update();
            if (!await serverManager.IsOnline())
                return this.AddToMessage("Server is not Running, cannot Join.");
            this.AddToMessage("Connect to the Server using the Following Connection Info:");
            this.AddToMessage("```" + connectionInfo + "```");
        };
    }
}
module.exports = Join;
