import { BotDataManager } from "dna-discord-framework";
import fs from "fs";
import FactorioServerManager from "./FactorioServer/FactorioServerManager";
import { Client, ActivityType } from "discord.js";

class FactorioServerBotDataManager extends BotDataManager {
    //Current World Files

    /**
     * Factorio Server Manager
     */
    SERVER_MANAGER: FactorioServerManager = new FactorioServerManager();

    /**
     * Boolean Flag Indicating if a World has been Chosen
     */
    WORLD_CHOSEN: boolean = false;

    // The Default Port to Expose
    SERVER_PORT: number = 8213

    //Server Host name / IP Address
    SERVER_HOSTNAME: string = ""

    WORLD_CHANNEL_SET: boolean = false;

    WORLD_CHANNEL_ID: string = "";

    LAST_BACKUP_DATE: number = 0;

    BOT_SETUP: boolean = false;

    public CreateDirectories() {
        const world = "/home/factorio/World";
        const previews = "/home/factorio/Previews";
        const backups = "/home/factorio/Backups";
        const extras = "/home/factorio/Backups/Extras";

        if (!fs.existsSync(world))
            fs.mkdirSync(world, { recursive: true });

        if (!fs.existsSync(previews))
            fs.mkdirSync(previews, { recursive: true });

        if (!fs.existsSync(backups))
            fs.mkdirSync(backups, { recursive: true });

        if (!fs.existsSync(extras))
            fs.mkdirSync(extras, { recursive: true });
    }

    public Update() {
        this.SERVER_MANAGER.PlayerDB.Update();
        this.SERVER_MANAGER.SaveWorldInfo(true);
        this.SaveData();
    }

    public async SetupActivity(client: Client) {

        if (!client.user)
            return;

        if (this.BOT_SETUP)
            return this.ServerOffline(client);

        client.user.setActivity("Waiting for Bot Setup, check /help", { type: ActivityType.Custom });
    }

    public async ServerOffline(client: Client) {
        if (!client.user)
            return;

        if (await this.SERVER_MANAGER.IsOnline())
        {
            this.ServerOnline(client);
            return;
        }

        if (this.WORLD_CHOSEN)
            client.user.setActivity("Waiting for Server to Start ", { type: ActivityType.Custom });
        else
            client.user.setActivity("Waiting for World to be Chosen", { type: ActivityType.Custom });

    }

    public async ServerOnline(client: Client) {
        if (!client.user)
            return;

        if (!(await this.SERVER_MANAGER.IsOnline()))
        {
            this.ServerOffline(client);
            return;
        }

        client.user.setActivity("Factorio Server", { type: ActivityType.Playing });
    }

}

export default FactorioServerBotDataManager;