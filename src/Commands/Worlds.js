"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const fs_1 = __importDefault(require("fs"));
const FactorioServerManager_1 = __importDefault(require("../FactorioServer/FactorioServerManager"));
class Worlds extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "worlds";
        this.CommandDescription = "Returns a List of all the Worlds Generated and Available to Load";
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
        this.MB_25 = 1024 * 1024 * 25;
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let seed = interaction.options.getInteger("seed");
            let seeds = fs_1.default.readdirSync(FactorioServerManager_1.default.PreviewDirectory);
            dataManager.Update();
            dataManager.ServerOnline(client);
            if (seed) {
                let seedDirectory = `SEED_${seed}`;
                let worldInfoPath = `${FactorioServerManager_1.default.PreviewDirectory}/${seedDirectory}/WorldInfo.json`;
                if (!seeds.includes(seedDirectory))
                    return this.AddToMessage("Seed not Found. Could not Upload Preview");
                if (!fs_1.default.existsSync(worldInfoPath))
                    return this.AddToMessage("World Info is Missing. Could not Upload Preview");
                const jsonData = JSON.parse(fs_1.default.readFileSync(worldInfoPath, 'utf8'));
                let worldManager = new FactorioServerManager_1.default(jsonData);
                this.AddToMessage(`Uploading World: ${seed}`);
                if (!fs_1.default.existsSync(worldManager.WorldImage))
                    return this.AddToMessage("World Image is Missing. Could not Upload Preview");
                if (fs_1.default.fstatSync(fs_1.default.openSync(worldManager.WorldImage, 'r')).size < this.MB_25)
                    return this.AddFileToMessage(worldManager.WorldImage);
                else
                    this.AddToMessage("Map Image is too large to send, please download it from the server");
                if (fs_1.default.fstatSync(fs_1.default.openSync(worldManager.WorldFile, 'r')).size < this.MB_25)
                    return this.AddFileToMessage(worldManager.WorldFile);
                else
                    this.AddToMessage("Map File is too large to send, please download it from the server");
                return;
            }
            this.AddToMessage("Available Worlds to Load are:\n");
            seeds.forEach(seedDir => {
                if (!seedDir.startsWith("SEED_"))
                    return;
                let seed = seedDir.replace("SEED_", "");
                this.AddToMessage(seed);
            });
        };
        this.Options = [
            {
                name: "seed",
                description: "The Generated Seed to Load",
                type: dna_discord_framework_1.OptionTypesEnum.Integer,
                required: false
            }
        ];
    }
}
module.exports = Worlds;
