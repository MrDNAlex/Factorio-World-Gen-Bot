import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";

class Join extends Command {

    public CommandName: string = "join";

    public CommandDescription: string = "Sends the Join Info for the Factorio Server";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
        let serverManager = dataManager.SERVER_MANAGER;

        dataManager.Update();

        if (!await serverManager.IsOnline())
            return this.AddToMessage("Server is not Running, cannot Join.");

        this.AddToMessage("Connect to the Server using the Following Connection Info:");
        this.AddToMessage("```" + connectionInfo + "```");
    }
}

export = Join;