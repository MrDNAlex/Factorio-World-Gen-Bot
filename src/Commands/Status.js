"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const Time_1 = __importDefault(require("../Objects/Time"));
class Status extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "status";
        this.CommandDescription = "Returns the Status of the Factorio Server";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let serverManager = dataManager.SERVER_MANAGER;
            let uptime = new Date().getTime() - serverManager.StartTime;
            let uptimeString = new Time_1.default(uptime).GetTimeAsString();
            let backupTime = new Date().getTime() - dataManager.LAST_BACKUP_DATE;
            let backupTimeString = new Time_1.default(backupTime).GetTimeAsString();
            if (!await serverManager.IsOnline())
                return this.AddToMessage("Server is Offline, Status cannot be retrieved.");
            dataManager.Update();
            serverManager.PlayerDB.Update();
            this.AddToMessage(serverManager.Name);
            this.AddToMessage("\nPlayers Online: " + dataManager.SERVER_MANAGER.PlayerDB.GetOnlinePlayers().length);
            this.AddToMessage("Server Uptime: " + uptimeString);
            this.AddToMessage("Last Backup: " + backupTimeString);
            dataManager.ServerOnline(client);
        };
    }
}
module.exports = Status;
