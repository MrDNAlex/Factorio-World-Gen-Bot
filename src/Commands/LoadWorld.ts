
import { Client, ChatInputCommandInteraction, CacheType, Attachment } from "discord.js";
import { BashScriptRunner, BotData, BotDataManager, Command, ICommandOption, OptionTypesEnum } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import fs from "fs";
import path from "path";
import axios from "axios";
import FactorioServerManager from "../FactorioServer/FactorioServerManager";
import WorldGenManager from "../FactorioServer/WorldGenManager";

class LoadWorld extends Command {

    public CommandName: string = "loadworld";

    public CommandDescription: string = "Loads a World using the provided Seed or Backup File";

    public IsEphemeralResponse: boolean = true;

    public IsCommandBlocking: boolean = false;

    private MaxSeed: number = 2147483647;

    public RunCommand = async (client: Client, interaction: ChatInputCommandInteraction<CacheType>, BotDataManager: BotDataManager) => {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let serverManager = BotData.Instance(FactorioServerBotDataManager).SERVER_MANAGER;

        const seed = interaction.options.getInteger("seed");
        const backup = interaction.options.getAttachment("backup");
        const name = interaction.options.getString("name");

        dataManager.Update();

        if (!seed && !backup && !name)
        {
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

            if (!fs.existsSync(loadDir))
                fs.mkdirSync(loadDir, { recursive: true });

            if (backup.name.endsWith(".zip"))
                await this.LoadZipBackup(loadDir, backup, name);
            else
                await this.LoadBackup(loadDir, backup);

            this.AddToMessage("World Loaded Successfully!");
        }

        dataManager.WORLD_CHOSEN = true;
        dataManager.ServerOffline(client);
    }

    /**
     * Loads a World with the Specified Seed
     * @param seed User specifie Seed to load 
     * @returns Error Messages when Applicable
     */
    public LoadSeed(seed: number) {
        let seedDirectory = "SEED_" + seed;
        let worldInfoPath = `${FactorioServerManager.PreviewDirectory}/${seedDirectory}/WorldInfo.json`;
        let seeds = fs.readdirSync(FactorioServerManager.PreviewDirectory);

        if (!seeds.includes(seedDirectory))
            return this.AddToMessage("Seed not Found. Could not Load World");

        if (!fs.existsSync(worldInfoPath))
            return this.AddToMessage("World Info is Missing. Could not Load World");

        const jsonData = JSON.parse(fs.readFileSync(worldInfoPath, 'utf8'));
        let worldManager = new FactorioServerManager(jsonData);

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
    public async LoadBackup(loadDir: string, backup: Attachment) {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let runner = new BashScriptRunner();
        let mapGen = path.join(loadDir, "MapGenSettings.json");
        let preview = path.join(loadDir, "Preview.png");
        let world = path.join(loadDir, "World.zip");
        let worldInfo = path.join(loadDir, "WorldInfo.json");

        await this.DownloadFile(backup, path.join(loadDir, "Load.tar.gz"));

        await runner.RunLocally(`tar -xzf Load.tar.gz`, true, loadDir).catch((error) => {
            console.error(`Error Loading Backup: ${error}`);
            this.AddToMessage("Error Loading Backup. Please Check the Logs for more Information.");
        });

        this.AddToMessage("Checking File Format...");

        if (!(fs.existsSync(mapGen) && fs.existsSync(preview) && fs.existsSync(world) && fs.existsSync(worldInfo)))
            return this.AddToMessage("Unrecognizable Backup File Format. Files are Missing, Cannot Load World");

        const jsonData = JSON.parse(fs.readFileSync("/home/factorio/Backups/Load/WorldInfo.json", 'utf8'));
        let worldManager = new FactorioServerManager(jsonData);

        fs.cpSync(preview, worldManager.WorldImage);
        fs.cpSync(world, worldManager.WorldFile);
        fs.cpSync(mapGen, worldManager.WorldSettings);
        fs.cpSync(worldInfo, worldManager.WorldInfo);

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
    public async LoadZipBackup(loadDir: string, backup: Attachment, name: string | null) {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);
        let runner = new BashScriptRunner();
        let worldGenManager = new WorldGenManager();
        let seed = Math.floor(Math.random() * this.MaxSeed);

        this.AddToMessage("Assigning Seed to World...");

        while (fs.existsSync(path.join(FactorioServerManager.PreviewDirectory, `SEED_${seed}`)))
            seed = Math.floor(Math.random() * this.MaxSeed);

        this.AddToMessage(`Seed: ${seed}`);

        if (!name) {
            name = `SEED_${seed}`;
            this.AddToMessage(`Name not Specified. Using Seed Name: ${name}`);
        } else
            this.AddToMessage(`Assigning World Name : ${name}`);

        worldGenManager.GenWorld(name, seed, backup);

        await this.DownloadFile(backup, path.join(loadDir, "Load.zip"));

        await runner.RunLocally(`unzip Load.zip`, true, loadDir).catch((error) => {
            console.error(`Error Loading Backup: ${error}`);
            this.AddToMessage("Error Loading Backup. Please Check the Logs for more Information.");
        });

        this.AddToMessage("Checking File Format...");

        if (!this.ZipFilesExist(loadDir))
            return this.AddToMessage("Unrecognizable Backup File Format. Files are Missing, Cannot Load World");

        this.BackupCurrentWorld();
        this.DeleteFolder(FactorioServerManager.WorldDirectory);

        worldGenManager.ServerManager.SaveWorldInfo(false);

        fs.cpSync(path.join(loadDir, "Load.zip"), FactorioServerManager.WorldFilePath);
        fs.cpSync("/FactorioBot/src/Files/Factorio.png", FactorioServerManager.WorldImagePath);
        fs.cpSync("/FactorioBot/src/Files/MapGenTemplate.json", FactorioServerManager.WorldSettingsPath);
        fs.cpSync(worldGenManager.ServerManager.WorldInfo, FactorioServerManager.WorldInfoPath);

        this.DeleteFolder(loadDir);

        dataManager.SERVER_MANAGER = worldGenManager.ServerManager;
    }

    /**
     * Checks if the Uploaded Zip File is in the Correct Format
     * @param loadDir The Directory at which the Zip File is Extracted
     * @returns Boolean Flag | True if the Files Exist, False if the Files are Missing
     */
    public ZipFilesExist(loadDir: string) {
        let control = path.join(loadDir, "World", "control.lua");
        let description = path.join(loadDir, "World", "description.json");
        let freeplay = path.join(loadDir, "World", "freeplay.lua");
        let info = path.join(loadDir, "World", "info.json");
        let level = path.join(loadDir, "World", "level.dat0");
        let levelMetaData = path.join(loadDir, "World", "level.datmetadata");
        let levelInit = path.join(loadDir, "World", "level-init.dat");
        let script = path.join(loadDir, "World", "script.dat");
        let locale = path.join(loadDir, "World", "locale");

        return fs.existsSync(control) && fs.existsSync(description) && fs.existsSync(freeplay) && fs.existsSync(info) && fs.existsSync(level) && fs.existsSync(levelMetaData) && fs.existsSync(levelInit) && fs.existsSync(script) && fs.existsSync(locale);
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

    /**
     * Replaces the World Data that is loaded with the 
     * @param worldInfo 
     */
    public ReplaceWorldData(worldInfo: FactorioServerManager) {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);

        this.DeleteFolder(FactorioServerManager.WorldDirectory);

        fs.cpSync(worldInfo.WorldImage, FactorioServerManager.WorldImagePath);
        fs.cpSync(worldInfo.WorldFile, FactorioServerManager.WorldFilePath);
        fs.cpSync(worldInfo.WorldSettings, FactorioServerManager.WorldSettingsPath);
        fs.cpSync(worldInfo.WorldInfo, FactorioServerManager.WorldInfoPath);

        dataManager.SERVER_MANAGER = worldInfo;
    }

    /**
     * Backs up the Current World Files
     */
    public BackupCurrentWorld() {
        let serverManager = BotData.Instance(FactorioServerBotDataManager).SERVER_MANAGER;

        this.DeleteFolder(serverManager.WorldDirectory);

        fs.cpSync(FactorioServerManager.WorldFilePath, serverManager.WorldFile);
        fs.cpSync(FactorioServerManager.WorldSettingsPath, serverManager.WorldSettings);
        fs.cpSync(FactorioServerManager.WorldInfoPath, serverManager.WorldInfo);
        fs.cpSync(FactorioServerManager.WorldImagePath, serverManager.WorldImage);
    }

    /**
     * Donwloads the Map Generation Settings file
     * @param attachement The File to download
     * @param downloadPath The Path and File Name to Download as
     * @returns Nothing
     */
    public async DownloadFile(attachement: Attachment | null, downloadPath: string) {

        if (!attachement)
            return

        try {
            const response = await axios({
                method: 'GET',
                url: attachement.url,
                responseType: 'stream',
            });

            let writer = fs.createWriteStream(downloadPath);

            await response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(`Failed to download the file: ${error}`);
        }
    }

    public Options?: ICommandOption[] =
        [
            {
                name: "seed",
                description: "The Generated Seed to Load",
                type: OptionTypesEnum.Integer,
                required: false
            },
            {
                name: "backup",
                description: "The Backup File to Load",
                type: OptionTypesEnum.Attachment,
                required: false
            },
            {
                name: "name",
                description: "Name of the unspecified ZIP World",
                type: OptionTypesEnum.String,
                required: false
            }
        ]
}

export = LoadWorld;