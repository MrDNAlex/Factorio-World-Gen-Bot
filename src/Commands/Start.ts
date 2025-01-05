import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import FactorioServerManager from "../FactorioServer/FactorioServerManager";
import fs from "fs";

class Start extends Command {

    public CommandName: string = "start";

    public CommandDescription: string = "Starts the Factorio server";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
        let serverManager = dataManager.SERVER_MANAGER;

        if (!fs.existsSync(FactorioServerManager.WorldFilePath))
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
    }
}

export = Start;