import { BashScriptRunner, BotData } from "dna-discord-framework";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import { Attachment } from "discord.js";
import FactorioServerManager from "./FactorioServerManager";
import fs from "fs";
import axios from "axios";
import FactorioExecutableCommands from "../Enums/FactorioExecutableCommands";

class WorldGenManager {

    ServerManager: FactorioServerManager;

    constructor() {
        this.ServerManager = new FactorioServerManager();
    }

    public async GenWorld(name: string, seed: number, mapGenSettings: Attachment | null) {
        let worldDir = `${FactorioServerManager.PreviewDirectory}/SEED_${seed}`;

        if (!fs.existsSync(worldDir))
            fs.mkdirSync(worldDir, { recursive: true });

        this.ServerManager.Name = name;
        this.ServerManager.WorldSeed = seed;

        this.ServerManager.WorldDirectory = worldDir;
        this.ServerManager.WorldSettings = `${worldDir}/MapGenSettings.json`;
        this.ServerManager.WorldInfo = `${worldDir}/WorldInfo.json`;
        this.ServerManager.WorldImage = `${worldDir}/Preview.png`;
        this.ServerManager.WorldFile = `${worldDir}/World.zip`;

        if (mapGenSettings)
            await this.DownloadFile(mapGenSettings, this.ServerManager.WorldSettings);
        else
            fs.cpSync(FactorioServerManager.MapGenTemplate, this.ServerManager.WorldSettings);
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

    /**
     * Generates a an Image of the World with the given Preview Size
     * @param worldInfo The World Info that needs to be generated
     * @param previewImageSize The Size of the World Image in Pixels (Width and Height)
     * @returns A Boolean Flag to indicate a successful generation of the World Image
     */
    public async GenerateWorldPreview(previewImageSize: number) {
        this.ServerManager.WorldImageSize = previewImageSize;

        let worldImageRunner = new BashScriptRunner();
        let success = true;
        let imageCommand = `factorio ${FactorioExecutableCommands.GenerateMapPreview} ${this.ServerManager.WorldImage} ${FactorioExecutableCommands.MapGenSettings} ${this.ServerManager.WorldSettings}  ${FactorioExecutableCommands.MapPreviewSize} ${this.ServerManager.WorldImageSize} ${FactorioExecutableCommands.MapGenSeed} ${this.ServerManager.WorldSeed}`;

        await worldImageRunner.RunLocally(imageCommand, true).catch((err) => {
            console.log("Error Generating World Image");
            console.log(err);
            success = false;
        });

        return success;
    }

    /**
     * Generates the World File for the Factorio Server (ZIP File)
     * @param worldInfo The World Info that needs to be generated
     * @returns A Boolean Flag to indicate a successful generation of the World Image
     */
    public async GenerateWorldFile() {
        let worldFileRunner = new BashScriptRunner();
        let success = true;
        let worldCommand = `factorio ${FactorioExecutableCommands.Create} ${this.ServerManager.WorldFile} ${FactorioExecutableCommands.MapGenSettings} ${this.ServerManager.WorldSettings} ${FactorioExecutableCommands.MapGenSeed} ${this.ServerManager.WorldSeed}`;

        await worldFileRunner.RunLocally(worldCommand, true).catch((err) => {
            console.log("Error Generating World File");
            console.log(err);
            success = false;
            return;
        });

        return success;
    }
}

export default WorldGenManager;