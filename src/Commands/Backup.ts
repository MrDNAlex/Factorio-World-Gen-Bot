import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import fs from "fs";
import fsp from "fs/promises";
import FactorioServerManager from "../FactorioServer/FactorioServerManager";

class Backup extends Command {

    public CommandName: string = "backup";

    public CommandDescription: string = "Creates a Backup of the Server";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    private MB_25 = 1024 * 1024 * 25;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let serverManager = dataManager.SERVER_MANAGER;

        dataManager.Update();

        this.AddToMessage("Creating Backup of World...");

        let backupSuccess = await serverManager.Backup();

        if (!backupSuccess)
            return this.AddToMessage("Error creating backup");

        this.AddToMessage("Backup Created Successfully!");

        const fileStats = await fsp.stat(FactorioServerManager.BackupFile);

        if (fileStats.size < this.MB_25)
            this.AddFileToMessage(FactorioServerManager.BackupFile);
        else
            this.AddToMessage("Backup File is too large to send, please download it from the server");
    }

    public GetFileSize(fileStats: fs.Stats): [Number, string] {
        let realsize;
        let sizeFormat;

        if (fileStats.size / (1024 * 1024) >= 1) {
            realsize = Math.floor(100 * fileStats.size / (1024 * 1024)) / 100;
            sizeFormat = "MB";
        } else if (fileStats.size / (1024) >= 1) {
            realsize = Math.floor(100 * fileStats.size / (1024)) / 100;
            sizeFormat = "KB";
        } else {
            realsize = fileStats.size;
            sizeFormat = "B";
        }

        return [realsize, sizeFormat];
    }
}

export = Backup;