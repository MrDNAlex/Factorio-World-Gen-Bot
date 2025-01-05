import { Client, ChatInputCommandInteraction, CacheType, ChannelType } from "discord.js";
import { BotData, BotDataManager, Command, ICommandOption, OptionTypesEnum } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";

class Start extends Command {

    public CommandName: string = "setup";

    public CommandDescription: string = "Sets up the Server with the Appropriate Connection Info.";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) =>
    {
        const worldChannel = interaction.options.getChannel("worldchannel");

        let dataManager = BotData.Instance(FactorioServerBotDataManager);

        if (worldChannel)
        {
            if (worldChannel.type != ChannelType.GuildText)
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
    }

    Options: ICommandOption[] = [
        {
            name: "worldchannel",
            description: "The Channel where Generated Worlds will be Sent and Shared",
            required: false,
            type: OptionTypesEnum.Channel,
        }
    ]
}

export = Start;