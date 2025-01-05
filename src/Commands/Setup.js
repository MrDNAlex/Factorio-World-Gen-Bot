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
            const worldChannel = interaction.options.getChannel("worldchannel");
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            if (worldChannel) {
                if (worldChannel.type != discord_js_1.ChannelType.GuildText)
                    return this.AddToMessage("World Channel must be a Text Channel");
                dataManager.WORLD_CHANNEL_ID = worldChannel.id;
                dataManager.WORLD_CHANNEL_SET = true;
            }
            this.AddToMessage("Bot has been Setup with the Following Info:");
            if (worldChannel)
                this.AddToMessage(`World Channel: ${worldChannel}`);
            dataManager.BOT_SETUP = true;
            dataManager.SetActivity(client);
            dataManager.SaveData();
        };
        this.Options = [
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
