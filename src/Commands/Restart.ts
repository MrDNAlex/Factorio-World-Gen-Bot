import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import { server } from "typescript";

class Restart extends Command {

    public CommandName: string = "restart";

    public CommandDescription: string = "Restarts the Factorio server";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
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
    }
}

export = Restart;