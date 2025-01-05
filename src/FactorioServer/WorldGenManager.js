"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerManager_1 = __importDefault(require("./FactorioServerManager"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const FactorioExecutableCommands_1 = __importDefault(require("../Enums/FactorioExecutableCommands"));
class WorldGenManager {
    constructor() {
        this.ServerManager = new FactorioServerManager_1.default();
    }
    async GenWorld(name, seed, mapGenSettings) {
        let worldDir = `${FactorioServerManager_1.default.PreviewDirectory}/SEED_${seed}`;
        if (!fs_1.default.existsSync(worldDir))
            fs_1.default.mkdirSync(worldDir, { recursive: true });
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
            fs_1.default.cpSync(FactorioServerManager_1.default.MapGenTemplate, this.ServerManager.WorldSettings);
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
    /**
     * Generates a an Image of the World with the given Preview Size
     * @param worldInfo The World Info that needs to be generated
     * @param previewImageSize The Size of the World Image in Pixels (Width and Height)
     * @returns A Boolean Flag to indicate a successful generation of the World Image
     */
    async GenerateWorldPreview(previewImageSize) {
        this.ServerManager.WorldImageSize = previewImageSize;
        let worldImageRunner = new dna_discord_framework_1.BashScriptRunner();
        let success = true;
        let imageCommand = `factorio ${FactorioExecutableCommands_1.default.GenerateMapPreview} ${this.ServerManager.WorldImage} ${FactorioExecutableCommands_1.default.MapGenSettings} ${this.ServerManager.WorldSettings}  ${FactorioExecutableCommands_1.default.MapPreviewSize} ${this.ServerManager.WorldImageSize} ${FactorioExecutableCommands_1.default.MapGenSeed} ${this.ServerManager.WorldSeed}`;
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
    async GenerateWorldFile() {
        let worldFileRunner = new dna_discord_framework_1.BashScriptRunner();
        let success = true;
        let worldCommand = `factorio ${FactorioExecutableCommands_1.default.Create} ${this.ServerManager.WorldFile} ${FactorioExecutableCommands_1.default.MapGenSettings} ${this.ServerManager.WorldSettings} ${FactorioExecutableCommands_1.default.MapGenSeed} ${this.ServerManager.WorldSeed}`;
        await worldFileRunner.RunLocally(worldCommand, true).catch((err) => {
            console.log("Error Generating World File");
            console.log(err);
            success = false;
            return;
        });
        return success;
    }
}
exports.default = WorldGenManager;
