import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import Time from "../Objects/Time";

class Players extends Command {

    public CommandName: string = "players";

    public CommandDescription: string = "Returns the List of Online Players in the Factorio Server";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
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
                let playtime = new Time(playerDB.Players[player].GetTotalPlayTime()).GetTimeAsString();
                let playtimeString = ` - ${playtime}`;
                this.AddToMessage(player + playtimeString);
            });

        this.AddToMessage("\nPlayers Offline: (Username - Playtime - Last Online)");

        if (offlinePlayers.length == 0)
            this.AddToMessage("No Players Offline.");
        else
            offlinePlayers.forEach(player => {
                let playtime = new Time(playerDB.Players[player].GetTotalPlayTime()).GetTimeAsString();
                let playtimeString = ` - ${playtime}`;

                let loginIndex = playerDB.Players[player].DisconnectTimeStamps.length - 1;

                let lastLogin = new Date().getTime() - playerDB.Players[player].DisconnectTimeStamps[loginIndex];
                let lastLoginString = ` - ${new Time(lastLogin).GetTimeAsString()}`;

                this.AddToMessage(player + playtimeString + lastLoginString);
            });

        dataManager.ServerOnline(client);
    }
}

export = Players;