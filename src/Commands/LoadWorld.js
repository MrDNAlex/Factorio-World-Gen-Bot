"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const FactorioServerManager_1 = __importDefault(require("../FactorioServer/FactorioServerManager"));
const WorldGenManager_1 = __importDefault(require("../FactorioServer/WorldGenManager"));
class LoadWorld extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "loadworld";
        this.CommandDescription = "Loads a World using the provided Seed or Backup File";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.MaxSeed = 2147483647;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let serverManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default).SERVER_MANAGER;
            const seed = interaction.options.getInteger("seed");
            const backup = interaction.options.getAttachment("backup");
            const name = interaction.options.getString("name");
            dataManager.Update();
            if (!seed && !backup && !name) {
                this.AddToMessage("There are Multiple Options to Load a World:");
                this.AddToMessage("1. If you have previously generated Worlds and have not wiped the Data, you can Load a World using a Seed: '/loadworld Seed=12345', available Seeds can be seen using '/worlds'");
                this.AddToMessage("2. If you have a Backup File created by the Bot, you can Load a World using the Backup File: '/loadworld Backup=Backup.tar.gz', drag and drop the File into the Backup Field");
                this.AddToMessage("3. If you have a Solo save file and want to make it a Server you can Load a World using the Backup File: '/loadworld Backup=World.zip', drag and drop the File into the Backup Field");
                return;
            }
            if (await serverManager.IsOnline())
                return this.AddToMessage("Server cannot be Running when Loading a World.");
            if (seed && backup)
                return this.AddToMessage("Cannot Load both a Seed and a Backup File.");
            if (seed)
                this.LoadSeed(seed);
            if (backup) {
                let loadDir = "/home/factorio/Backups/Load";
                this.AddToMessage("Loading Backup...");
                if (!fs_1.default.existsSync(loadDir))
                    fs_1.default.mkdirSync(loadDir, { recursive: true });
                if (backup.name.endsWith(".zip"))
                    await this.LoadZipBackup(loadDir, backup, name);
                else
                    await this.LoadBackup(loadDir, backup);
                this.AddToMessage("World Loaded Successfully!");
            }
            dataManager.WORLD_CHOSEN = true;
            dataManager.ServerOffline(client);
        };
        this.Options = [
            {
                name: "seed",
                description: "The Generated Seed to Load",
                type: dna_discord_framework_1.OptionTypesEnum.Integer,
                required: false
            },
            {
                name: "backup",
                description: "The Backup File to Load",
                type: dna_discord_framework_1.OptionTypesEnum.Attachment,
                required: false
            },
            {
                name: "name",
                description: "Name of the unspecified ZIP World",
                type: dna_discord_framework_1.OptionTypesEnum.String,
                required: false
            }
        ];
    }
    /**
     * Loads a World with the Specified Seed
     * @param seed User specifie Seed to load
     * @returns Error Messages when Applicable
     */
    LoadSeed(seed) {
        let seedDirectory = "SEED_" + seed;
        let worldInfoPath = `${FactorioServerManager_1.default.PreviewDirectory}/${seedDirectory}/WorldInfo.json`;
        let seeds = fs_1.default.readdirSync(FactorioServerManager_1.default.PreviewDirectory);
        if (!seeds.includes(seedDirectory))
            return this.AddToMessage("Seed not Found. Could not Load World");
        if (!fs_1.default.existsSync(worldInfoPath))
            return this.AddToMessage("World Info is Missing. Could not Load World");
        const jsonData = JSON.parse(fs_1.default.readFileSync(worldInfoPath, 'utf8'));
        let worldManager = new FactorioServerManager_1.default(jsonData);
        this.AddToMessage(`Loading Seed: ${seed}...`);
        if (!worldManager.AllFilesExist())
            return this.AddToMessage("World Files are Missing. Could not Load World");
        this.BackupCurrentWorld();
        this.ReplaceWorldData(worldManager);
        this.AddToMessage("World Loaded Successfully!");
    }
    /**
     * Loads a Factorio Server Bot Backup to the Server
     * @param loadDir Directory to Download and check file format
     * @param backup The Uploaded World file to Load
     * @returns Error Messages when applicable
     */
    async LoadBackup(loadDir, backup) {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let runner = new dna_discord_framework_1.BashScriptRunner();
        let mapGen = path_1.default.join(loadDir, "MapGenSettings.json");
        let preview = path_1.default.join(loadDir, "Preview.png");
        let world = path_1.default.join(loadDir, "World.zip");
        let worldInfo = path_1.default.join(loadDir, "WorldInfo.json");
        await this.DownloadFile(backup, path_1.default.join(loadDir, "Load.tar.gz"));
        await runner.RunLocally(`tar -xzf Load.tar.gz`, true, loadDir).catch((error) => {
            console.error(`Error Loading Backup: ${error}`);
            this.AddToMessage("Error Loading Backup. Please Check the Logs for more Information.");
        });
        this.AddToMessage("Checking File Format...");
        if (!(fs_1.default.existsSync(mapGen) && fs_1.default.existsSync(preview) && fs_1.default.existsSync(world) && fs_1.default.existsSync(worldInfo)))
            return this.AddToMessage("Unrecognizable Backup File Format. Files are Missing, Cannot Load World");
        const jsonData = JSON.parse(fs_1.default.readFileSync("/home/factorio/Backups/Load/WorldInfo.json", 'utf8'));
        let worldManager = new FactorioServerManager_1.default(jsonData);
        fs_1.default.cpSync(preview, worldManager.WorldImage);
        fs_1.default.cpSync(world, worldManager.WorldFile);
        fs_1.default.cpSync(mapGen, worldManager.WorldSettings);
        fs_1.default.cpSync(worldInfo, worldManager.WorldInfo);
        this.BackupCurrentWorld();
        this.ReplaceWorldData(worldManager);
        this.DeleteFolder(loadDir);
        dataManager.SERVER_MANAGER = worldManager;
    }
    /**
     * Tries to Load the Uplaoded ZIP World File To run on the Server
     * @param loadDir Directory to Download and check file format
     * @param backup The Uploaded World file to Load
     * @returns Error Messages when applicable
     */
    async LoadZipBackup(loadDir, backup, name) {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let runner = new dna_discord_framework_1.BashScriptRunner();
        let worldGenManager = new WorldGenManager_1.default();
        let seed = Math.floor(Math.random() * this.MaxSeed);
        this.AddToMessage("Assigning Seed to World...");
        while (fs_1.default.existsSync(path_1.default.join(FactorioServerManager_1.default.PreviewDirectory, `SEED_${seed}`)))
            seed = Math.floor(Math.random() * this.MaxSeed);
        this.AddToMessage(`Seed: ${seed}`);
        if (!name) {
            name = `SEED_${seed}`;
            this.AddToMessage(`Name not Specified. Using Seed Name: ${name}`);
        }
        else
            this.AddToMessage(`Assigning World Name : ${name}`);
        worldGenManager.GenWorld(name, seed, backup);
        await this.DownloadFile(backup, path_1.default.join(loadDir, "Load.zip"));
        await runner.RunLocally(`unzip Load.zip`, true, loadDir).catch((error) => {
            console.error(`Error Loading Backup: ${error}`);
            this.AddToMessage("Error Loading Backup. Please Check the Logs for more Information.");
        });
        this.AddToMessage("Checking File Format...");
        if (!this.ZipFilesExist(loadDir))
            return this.AddToMessage("Unrecognizable Backup File Format. Files are Missing, Cannot Load World");
        this.BackupCurrentWorld();
        this.DeleteFolder(FactorioServerManager_1.default.WorldDirectory);
        worldGenManager.ServerManager.SaveWorldInfo(false);
        fs_1.default.cpSync(path_1.default.join(loadDir, "Load.zip"), FactorioServerManager_1.default.WorldFilePath);
        fs_1.default.cpSync("/FactorioBot/src/Files/Factorio.png", FactorioServerManager_1.default.WorldImagePath);
        fs_1.default.cpSync("/FactorioBot/src/Files/MapGenTemplate.json", FactorioServerManager_1.default.WorldSettingsPath);
        fs_1.default.cpSync(worldGenManager.ServerManager.WorldInfo, FactorioServerManager_1.default.WorldInfoPath);
        this.DeleteFolder(loadDir);
        dataManager.SERVER_MANAGER = worldGenManager.ServerManager;
    }
    /**
     * Checks if the Uploaded Zip File is in the Correct Format
     * @param loadDir The Directory at which the Zip File is Extracted
     * @returns Boolean Flag | True if the Files Exist, False if the Files are Missing
     */
    ZipFilesExist(loadDir) {
        let control = path_1.default.join(loadDir, "World", "control.lua");
        let description = path_1.default.join(loadDir, "World", "description.json");
        let freeplay = path_1.default.join(loadDir, "World", "freeplay.lua");
        let info = path_1.default.join(loadDir, "World", "info.json");
        let level = path_1.default.join(loadDir, "World", "level.dat0");
        let levelMetaData = path_1.default.join(loadDir, "World", "level.datmetadata");
        let levelInit = path_1.default.join(loadDir, "World", "level-init.dat");
        let script = path_1.default.join(loadDir, "World", "script.dat");
        let locale = path_1.default.join(loadDir, "World", "locale");
        return fs_1.default.existsSync(control) && fs_1.default.existsSync(description) && fs_1.default.existsSync(freeplay) && fs_1.default.existsSync(info) && fs_1.default.existsSync(level) && fs_1.default.existsSync(levelMetaData) && fs_1.default.existsSync(levelInit) && fs_1.default.existsSync(script) && fs_1.default.existsSync(locale);
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
    /**
     * Replaces the World Data that is loaded with the
     * @param worldInfo
     */
    ReplaceWorldData(worldInfo) {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        this.DeleteFolder(FactorioServerManager_1.default.WorldDirectory);
        fs_1.default.cpSync(worldInfo.WorldImage, FactorioServerManager_1.default.WorldImagePath);
        fs_1.default.cpSync(worldInfo.WorldFile, FactorioServerManager_1.default.WorldFilePath);
        fs_1.default.cpSync(worldInfo.WorldSettings, FactorioServerManager_1.default.WorldSettingsPath);
        fs_1.default.cpSync(worldInfo.WorldInfo, FactorioServerManager_1.default.WorldInfoPath);
        dataManager.SERVER_MANAGER = worldInfo;
    }
    /**
     * Backs up the Current World Files
     */
    BackupCurrentWorld() {
        let serverManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default).SERVER_MANAGER;
        this.DeleteFolder(serverManager.WorldDirectory);
        fs_1.default.cpSync(FactorioServerManager_1.default.WorldFilePath, serverManager.WorldFile);
        fs_1.default.cpSync(FactorioServerManager_1.default.WorldSettingsPath, serverManager.WorldSettings);
        fs_1.default.cpSync(FactorioServerManager_1.default.WorldInfoPath, serverManager.WorldInfo);
        fs_1.default.cpSync(FactorioServerManager_1.default.WorldImagePath, serverManager.WorldImage);
    }
    /**
     * Donwloads the Map Generation Settings file
     * @param attachement The File to download
     * @param downloadPath The Path and File Name to Download as
     * @returns Nothing
     */
    async DownloadFile(attachement, downloadPath) {
        if (!attachement)
            return;
        try {
            const response = await (0, axios_1.default)({
                method: 'GET',
                url: attachement.url,
                responseType: 'stream',
            });
            let writer = fs_1.default.createWriteStream(downloadPath);
            await response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }
        catch (error) {
            console.error(`Failed to download the file: ${error}`);
        }
    }
}
module.exports = LoadWorld;
