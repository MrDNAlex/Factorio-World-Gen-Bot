import { Client, ChatInputCommandInteraction, CacheType, TextChannel } from "discord.js";
import { BotData, BotDataManager, BotMessage, Command, ICommandOption, OptionTypesEnum } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import fs from "fs";
import path from "path";
import FactorioServerManager from "../FactorioServer/FactorioServerManager";
import WorldGenManager from "../FactorioServer/WorldGenManager";

class GenWorld extends Command {

    public CommandName: string = "genworld";

    public CommandDescription: string = "Creates a new World with a Preview Image.";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = true;

    private MaxSeed: number = 2147483647;

    private MB_25 = 1024 * 1024 * 25;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        const previewSize = interaction.options.getInteger("previewsize");
        const mapGenSettings = interaction.options.getAttachment("mapgensettings");
        const userSeed = interaction.options.getInteger("seed");
        const name = interaction.options.getString("name");

        let previewImageSize = 1024;
        let seed = Math.floor(Math.random() * this.MaxSeed);
        let dataManager = BotData.Instance(FactorioServerBotDataManager);

        dataManager.Update();

        if (await dataManager.SERVER_MANAGER.IsOnline())
            return this.AddToMessage("Server cannot be Running when Generating a World.");

        if (!name)
            return this.AddToMessage("Name is Required for the World!");

        if (userSeed)
            seed = userSeed;

        if (previewSize)
            previewImageSize = previewSize;

        let worldGenManager = new WorldGenManager();

        await worldGenManager.GenWorld(name, seed, mapGenSettings);

        this.AddToMessage("Generating Map...");
        this.AddToMessage(`Seed: ${worldGenManager.ServerManager.WorldSeed}`);
        this.AddToMessage(`Name: ${worldGenManager.ServerManager.Name}`);
        this.AddToMessage("Generating World Image...");

        let worldImageStatus = await worldGenManager.GenerateWorldPreview(previewImageSize);

        if (!worldImageStatus || !(fs.existsSync(worldGenManager.ServerManager.WorldImage)))
            return this.AddToMessage("Error Generatting World Image : Try Again");

        if (worldImageStatus)
            worldGenManager.ServerManager.SaveWorldInfo(false);

        if (!(fs.fstatSync(fs.openSync(worldGenManager.ServerManager.WorldImage, 'r')).size < this.MB_25))
            this.AddToMessage("Map Image is too large to send, please download it from the server");
        else
            this.AddFileToMessage(worldGenManager.ServerManager.WorldImage);

        this.AddToMessage("Generating World File...");

        let worldFileStatus = await worldGenManager.GenerateWorldFile();

        if (!worldFileStatus || !(fs.existsSync(worldGenManager.ServerManager.WorldFile)))
            return this.AddToMessage("Error Generatting World File : Try Again");

        this.AddToMessage("World Generation Complete!");

        if (dataManager.WORLD_CHANNEL_SET)
            this.UploadWorldInfo(client, worldGenManager.ServerManager);

        dataManager.ServerOffline(client);

        if (dataManager.WORLD_CHOSEN)
            return this.AddToMessage("A World has already been Loaded. You can replace the world with what was generated using '/loadworld'")

        this.ReplaceWorldData(worldGenManager.ServerManager);
        dataManager.SERVER_MANAGER = worldGenManager.ServerManager;
        dataManager.SERVER_MANAGER.SaveWorldInfo(true);
    }

    /**
     * Deletes the Previous Data associated with the Seed
     */
    public DeleteFolder(directoryPath: string) {
        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            const fullPath = path.join(directoryPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory())
                fs.rmSync(fullPath, { recursive: true, force: true });
            else
                fs.unlinkSync(fullPath);
        }
    }

    public async UploadWorldInfo(client: Client, worldInfo: FactorioServerManager) {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let worldChannel = await client.channels.fetch(dataManager.WORLD_CHANNEL_ID) as TextChannel;
        let worldUploadMessage = new BotMessage(worldChannel);

        worldUploadMessage.AddMessage("New World Generated!");
        worldUploadMessage.AddMessage(`Seed: ${worldInfo.WorldSeed}`);

        if (fs.existsSync(worldInfo.WorldImage) && fs.fstatSync(fs.openSync(worldInfo.WorldImage, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldImage);

        if (fs.existsSync(worldInfo.WorldFile) && fs.fstatSync(fs.openSync(worldInfo.WorldFile, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldFile);

        if (fs.existsSync(worldInfo.WorldSettings) && fs.fstatSync(fs.openSync(worldInfo.WorldSettings, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldSettings);

        if (fs.existsSync(worldInfo.WorldInfo) && fs.fstatSync(fs.openSync(worldInfo.WorldInfo, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldInfo);
    }

    /**
     * Replaces the World Data that is loaded with the 
     * @param worldInfo 
     */
    public ReplaceWorldData(worldInfo: FactorioServerManager) {
        this.DeleteFolder(FactorioServerManager.WorldDirectory);

        fs.cpSync(worldInfo.WorldImage, FactorioServerManager.WorldImagePath);
        fs.cpSync(worldInfo.WorldFile, FactorioServerManager.WorldFilePath);
        fs.cpSync(worldInfo.WorldSettings, FactorioServerManager.WorldSettingsPath);
        fs.cpSync(worldInfo.WorldInfo, FactorioServerManager.WorldInfoPath);
    }

    Options: ICommandOption[] = [
        {
            name: "name",
            description: "Name of the World",
            required: true,
            type: OptionTypesEnum.String,
        },
        {
            name: "previewsize",
            description: "Size of the map preview PNG in pixels (Default is 1024)",
            required: false,
            type: OptionTypesEnum.Integer,
        },
        {
            name: "mapgensettings",
            description: "Settings file for the Map Generation, get the template from /help",
            required: false,
            type: OptionTypesEnum.Attachment,
        },
        {
            name: "seed",
            description: "The seed for the map generation",
            required: false,
            type: OptionTypesEnum.Integer,
        }
    ]
}

export = GenWorld;