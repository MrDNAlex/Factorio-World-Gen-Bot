"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const FactorioServerManager_1 = __importDefault(require("../FactorioServer/FactorioServerManager"));
const WorldGenManager_1 = __importDefault(require("../FactorioServer/WorldGenManager"));
class GenWorld extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "genworld";
        this.CommandDescription = "Creates a new World with a Preview Image.";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = true;
        this.MaxSeed = 2147483647;
        this.MB_25 = 1024 * 1024 * 25;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            const previewSize = interaction.options.getInteger("previewsize");
            const mapGenSettings = interaction.options.getAttachment("mapgensettings");
            const userSeed = interaction.options.getInteger("seed");
            const name = interaction.options.getString("name");
            let previewImageSize = 1024;
            let seed = Math.floor(Math.random() * this.MaxSeed);
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            dataManager.Update();
            if (await dataManager.SERVER_MANAGER.IsOnline())
                return this.AddToMessage("Server cannot be Running when Generating a World.");
            if (!name)
                return this.AddToMessage("Name is Required for the World!");
            if (userSeed)
                seed = userSeed;
            if (previewSize)
                previewImageSize = previewSize;
            let worldGenManager = new WorldGenManager_1.default();
            await worldGenManager.GenWorld(name, seed, mapGenSettings);
            this.AddToMessage("Generating Map...");
            this.AddToMessage(`Seed: ${worldGenManager.ServerManager.WorldSeed}`);
            this.AddToMessage(`Name: ${worldGenManager.ServerManager.Name}`);
            this.AddToMessage("Generating World Image...");
            let worldImageStatus = await worldGenManager.GenerateWorldPreview(previewImageSize);
            if (!worldImageStatus || !(fs_1.default.existsSync(worldGenManager.ServerManager.WorldImage)))
                return this.AddToMessage("Error Generatting World Image : Try Again");
            if (worldImageStatus)
                worldGenManager.ServerManager.SaveWorldInfo(false);
            if (!(fs_1.default.fstatSync(fs_1.default.openSync(worldGenManager.ServerManager.WorldImage, 'r')).size < this.MB_25))
                this.AddToMessage("Map Image is too large to send, please download it from the server");
            else
                this.AddFileToMessage(worldGenManager.ServerManager.WorldImage);
            this.AddToMessage("Generating World File...");
            let worldFileStatus = await worldGenManager.GenerateWorldFile();
            if (!worldFileStatus || !(fs_1.default.existsSync(worldGenManager.ServerManager.WorldFile)))
                return this.AddToMessage("Error Generatting World File : Try Again");
            this.AddToMessage("World Generation Complete!");
            if (dataManager.WORLD_CHANNEL_SET)
                this.UploadWorldInfo(client, worldGenManager.ServerManager);
            dataManager.ServerOffline(client);
            if (dataManager.WORLD_CHOSEN)
                return this.AddToMessage("A World has already been Loaded. You can replace the world with what was generated using '/loadworld'");
            this.ReplaceWorldData(worldGenManager.ServerManager);
            dataManager.SERVER_MANAGER = worldGenManager.ServerManager;
            dataManager.SERVER_MANAGER.SaveWorldInfo(true);
        };
        this.Options = [
            {
                name: "name",
                description: "Name of the World",
                required: true,
                type: dna_discord_framework_1.OptionTypesEnum.String,
            },
            {
                name: "previewsize",
                description: "Size of the map preview PNG in pixels (Default is 1024)",
                required: false,
                type: dna_discord_framework_1.OptionTypesEnum.Integer,
            },
            {
                name: "mapgensettings",
                description: "Settings file for the Map Generation, get the template from /help",
                required: false,
                type: dna_discord_framework_1.OptionTypesEnum.Attachment,
            },
            {
                name: "seed",
                description: "The seed for the map generation",
                required: false,
                type: dna_discord_framework_1.OptionTypesEnum.Integer,
            }
        ];
    }
    /**
     * Deletes the Previous Data associated with the Seed
     */
    DeleteFolder(directoryPath) {
        const files = fs_1.default.readdirSync(directoryPath);
        for (const file of files) {
            const fullPath = path_1.default.join(directoryPath, file);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isDirectory())
                fs_1.default.rmSync(fullPath, { recursive: true, force: true });
            else
                fs_1.default.unlinkSync(fullPath);
        }
    }
    async UploadWorldInfo(client, worldInfo) {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let worldChannel = await client.channels.fetch(dataManager.WORLD_CHANNEL_ID);
        let worldUploadMessage = new dna_discord_framework_1.BotMessage(worldChannel);
        worldUploadMessage.AddMessage("New World Generated!");
        worldUploadMessage.AddMessage(`Seed: ${worldInfo.WorldSeed}`);
        if (fs_1.default.existsSync(worldInfo.WorldImage) && fs_1.default.fstatSync(fs_1.default.openSync(worldInfo.WorldImage, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldImage);
        if (fs_1.default.existsSync(worldInfo.WorldFile) && fs_1.default.fstatSync(fs_1.default.openSync(worldInfo.WorldFile, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldFile);
        if (fs_1.default.existsSync(worldInfo.WorldSettings) && fs_1.default.fstatSync(fs_1.default.openSync(worldInfo.WorldSettings, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldSettings);
        if (fs_1.default.existsSync(worldInfo.WorldInfo) && fs_1.default.fstatSync(fs_1.default.openSync(worldInfo.WorldInfo, 'r')).size < this.MB_25)
            worldUploadMessage.AddFile(worldInfo.WorldInfo);
    }
    /**
     * Replaces the World Data that is loaded with the
     * @param worldInfo
     */
    ReplaceWorldData(worldInfo) {
        this.DeleteFolder(FactorioServerManager_1.default.WorldDirectory);
        fs_1.default.cpSync(worldInfo.WorldImage, FactorioServerManager_1.default.WorldImagePath);
        fs_1.default.cpSync(worldInfo.WorldFile, FactorioServerManager_1.default.WorldFilePath);
        fs_1.default.cpSync(worldInfo.WorldSettings, FactorioServerManager_1.default.WorldSettingsPath);
        fs_1.default.cpSync(worldInfo.WorldInfo, FactorioServerManager_1.default.WorldInfoPath);
    }
}
module.exports = GenWorld;
