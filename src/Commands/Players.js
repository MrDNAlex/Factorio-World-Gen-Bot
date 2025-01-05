"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const Time_1 = __importDefault(require("../Objects/Time"));
class Players extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "players";
        this.CommandDescription = "Returns the List of Online Players in the Factorio Server";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let playerDB = dataManager.SERVER_MANAGER.PlayerDB;
            let serverManager = dataManager.SERVER_MANAGER;
            dataManager.Update();
            if (!await serverManager.IsOnline())
                return this.AddToMessage("Server is Offline, Players cannot be retrieved.");
            playerDB.Update();
            let onlinePlayers = playerDB.GetOnlinePlayers();
            let offlinePlayers = playerDB.GetOfflinePlayers();
            this.AddToMessage(`${serverManager.Name} Players :`);
            this.AddToMessage("Players Online: (Username - Playtime)");
            if (onlinePlayers.length == 0)
                this.AddToMessage("No Players Online.");
            else
                onlinePlayers.forEach(player => {
                    let playtime = new Time_1.default(playerDB.Players[player].GetTotalPlayTime()).GetTimeAsString();
                    let playtimeString = ` - ${playtime}`;
                    this.AddToMessage(player + playtimeString);
                });
            this.AddToMessage("\nPlayers Offline: (Username - Playtime - Last Online)");
            if (offlinePlayers.length == 0)
                this.AddToMessage("No Players Offline.");
            else
                offlinePlayers.forEach(player => {
                    let playtime = new Time_1.default(playerDB.Players[player].GetTotalPlayTime()).GetTimeAsString();
                    let playtimeString = ` - ${playtime}`;
                    let loginIndex = playerDB.Players[player].DisconnectTimeStamps.length - 1;
                    let lastLogin = new Date().getTime() - playerDB.Players[player].DisconnectTimeStamps[loginIndex];
                    let lastLoginString = ` - ${new Time_1.default(lastLogin).GetTimeAsString()}`;
                    this.AddToMessage(player + playtimeString + lastLoginString);
                });
            dataManager.ServerOnline(client);
        };
    }
}
module.exports = Players;
