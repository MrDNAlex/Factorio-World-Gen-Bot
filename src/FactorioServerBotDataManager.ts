import { BotDataManager } from "dna-discord-framework";
import fs from "fs";
import { Client, ActivityType } from "discord.js";
import FactorioServerManager from "./FactorioServer/FactorioServerManager";

class FactorioServerBotDataManager extends BotDataManager {
    //Current World Files
    
    /**
     * Factorio Server Manager
     */
    SERVER_MANAGER: FactorioServerManager = new FactorioServerManager();

    WORLD_CHANNEL_SET: boolean = false;

    WORLD_CHANNEL_ID: string = "";

    LAST_BACKUP_DATE: number = 0;

    SERVER_PORT: number = 8213

    BOT_SETUP: boolean = false;

    public CreateDirectories() {
        const world = "/home/factorio/World";
        const previews = "/home/factorio/Previews";

        if (!fs.existsSync(world))
            fs.mkdirSync(world, { recursive: true });

        if (!fs.existsSync(previews))
            fs.mkdirSync(previews, { recursive: true });
    }

    public SetActivity(client: Client) {
        if (!client.user)
            return;

        if (this.BOT_SETUP)
            client.user.setActivity("Creator of Factorio Worlds", { type: ActivityType.Playing });
        else
            client.user.setActivity("Waiting for Bot Setup, check /help", { type: ActivityType.Custom });
    }
}

export default FactorioServerBotDataManager;