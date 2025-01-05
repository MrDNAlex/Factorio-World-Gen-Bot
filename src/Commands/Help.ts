import { Client, ChatInputCommandInteraction, CacheType } from "discord.js";
import { BotData, BotDataManager, Command } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import FactorioServerManager from "../FactorioServer/FactorioServerManager";

class Help extends Command {
    public CommandName: string = "help";

    public CommandDescription: string = "Displays helpful information about the bot and how to set up a Factorio Server";

    //Documentation : https://wiki.factorio.com/Multiplayer

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) =>
    {
        let dataManager = BotData.Instance(FactorioServerBotDataManager)
    
        let genMapCommand = "`/genworld`";
        let setupCommand = "`/setup`";
        let loadCommand = "`/loadworld`";
        let joinCommand = "`/join`";
        let statusCommand = "`/status`";
        let playersCommand = "`/players`";
        let shutdownCommand = "`/shutdown`";
        let restartCommand = "`/restart`";
        let backupCommand = "`/backup`";
        let startCommand = "`/start`";

        dataManager.Update();

        this.AddToMessage(`Hello! I am the Engineers Assistant! I am here to help you, the Engineer, set up a Factorio Server.`);
        this.AddToMessage("\nFollow the steps below to set up a Factorio Server:");
        this.AddToMessage(`1. Run the ${setupCommand} Command, specify the Hostname/IP Address (Same as your Routers IP) and Port (Default is 8213 if unspecified) and if you want to share World Gen announcements select a Text Channel.`);
        this.AddToMessage(`2. Once IP and Port are selected you will need to Port Forward the Port you selected to the Host Machine. This is done in your Router Settings (192.168.0.1 or 192.168.0.0 in Browser).`);
        this.AddToMessage(`3. You will need to Generate or Load a World using the ${genMapCommand} or ${loadCommand} Command. When Generating a World you can specifiy the MapGenSettings by Downloading and Modifying the Template Below.`);
        this.AddToMessage(`4. Once the World is Generated/Loaded you can Start the Server using the ${startCommand} Command. The Last Generated/Loaded World will be used.`);
        this.AddToMessage(`5. Once the Server is Running, you can Join the Server using the ${joinCommand} Command. This will provide you with the Connection Info.`);
        this.AddToMessage(`6. Once Live, Launch Factorio and Go to Multiplayer -> Connect to Address and Paste the Connection Info. You will be able to join the Server! Invite your Friends to Join!`);

        this.AddToMessage(`\nServer Management Commands are also Provided such as ${statusCommand}, ${playersCommand}, ${shutdownCommand}, ${restartCommand}, ${backupCommand}, ${startCommand}.`);
        this.AddFileToMessage(FactorioServerManager.MapGenTemplate);
    }

    public IsEphemeralResponse: boolean = true;
    public IsCommandBlocking: boolean = false;
}

export = Help;