"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dna_discord_framework_1 = require("dna-discord-framework");
const FactorioServerManager_1 = __importDefault(require("../FactorioServer/FactorioServerManager"));
class Help extends dna_discord_framework_1.Command {
    constructor() {
        super(...arguments);
        this.CommandName = "help";
        this.CommandDescription = "Displays helpful information about the bot and how to set up a Factorio Server";
        //Documentation : https://wiki.factorio.com/Multiplayer
        this.RunCommand = async (client, interaction, BotDataManager) => {
            let genMapCommand = "`/genworld`";
            let setupCommand = "`/setup`";
            let worldCommand = "`/world`";
            this.AddToMessage(`Hello! I am the Engineers Assistant! I am here to help you, the Engineer, Create Factorio Worlds!.`);
            this.AddToMessage(`I require a small setup to get started, but once done you can Create Factorio Worlds with ease!`);
            this.AddToMessage(`1. Run the ${setupCommand} Command to Setup the Bot. This will create the Required Directories and Files and you can Optionally set a Text Channel to Upload and Share the Generated Worlds.`);
            this.AddToMessage(`2. Once Setup is Complete you can Generate a World using the ${genMapCommand} Command. This will Generate a World and Create a Preview Image. You can modify the World Generation Settings by providing a MapGenSettings.json File which can be Downloaded Below.`);
            this.AddToMessage(`3. You can List all the Generated Worlds using the ${worldCommand} Command. This will show you all the Worlds you have Generated.`);
            this.AddToMessage(`Thats it! You can now Share the World with your Friends and Play Factorio!`);
            this.AddFileToMessage(FactorioServerManager_1.default.MapGenTemplate);
        };
        this.IsEphemeralResponse = true;
        this.IsCommandBlocking = false;
    }
}
module.exports = Help;
