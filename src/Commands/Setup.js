"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
class Start extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "setup";
        this.CommandDescription = "Sets up the Server with the Appropriate Connection Info.";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            const port = interaction.options.getInteger("port");
            const hostname = interaction.options.getString("hostname");
            const worldChannel = interaction.options.getChannel("worldchannel");
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            dataManager.Update();
            if (!hostname)
                return this.AddToMessage("Server Hostname not specified, a Hostname/IP Address must be specified for connection.");
            if (port)
                dataManager.SERVER_PORT = port;
            if (worldChannel) {
                if (worldChannel.type != discord_js_1.ChannelType.GuildText)
                    return this.AddToMessage("World Channel must be a Text Channel");
                dataManager.WORLD_CHANNEL_ID = worldChannel.id;
                dataManager.WORLD_CHANNEL_SET = true;
            }
            dataManager.SERVER_HOSTNAME = hostname;
            let connectionInfo = `${dataManager.SERVER_HOSTNAME}:${dataManager.SERVER_PORT}`;
            let connectionMessage = "```" + connectionInfo + "```";
            this.AddToMessage("Server has been Setup with the Following Connection Info:");
            this.AddToMessage(`Hostname: ${dataManager.SERVER_HOSTNAME}`);
            if (port)
                this.AddToMessage(`Port: ${dataManager.SERVER_PORT}`);
            if (worldChannel)
                this.AddToMessage(`World Channel: ${worldChannel}`);
            this.AddToMessage("\nOnce Server is Started you can Connect to the Server using the Following Connection Info:");
            this.AddToMessage(connectionMessage);
            dataManager.BOT_SETUP = true;
            dataManager.ServerOffline(client);
        };
        this.Options = [
            {
                name: "hostname",
                description: "The HostName or IP Address of the Server",
                required: true,
                type: dna_discord_framework_1.OptionTypesEnum.String,
            },
            {
                name: "port",
                description: "The Port the Server will be Exposed on",
                required: false,
                type: dna_discord_framework_1.OptionTypesEnum.Integer,
            },
            {
                name: "worldchannel",
                description: "The Channel where Generated Worlds will be Sent and Shared",
                required: false,
                type: dna_discord_framework_1.OptionTypesEnum.Channel,
            }
        ];
    }
}
module.exports = Start;
