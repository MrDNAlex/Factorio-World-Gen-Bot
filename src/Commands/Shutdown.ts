import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";

class Shutdown extends Command {

    public CommandName: string = "shutdown";

    public CommandDescription: string = "Shutsdown the Server that is running";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = true;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
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
    }
}

export = Shutdown;