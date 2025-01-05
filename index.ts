import { BotData, DiscordBot } from "dna-discord-framework";
import FactorioServerBotDataManager from "./src/FactorioServerBotDataManager";
    
const Bot = new DiscordBot(FactorioServerBotDataManager);

Bot.StartBot();

let dataManager = BotData.Instance(FactorioServerBotDataManager);

dataManager.CreateDirectories();
setTimeout(() => dataManager.SetActivity(Bot.BotInstance), 3000);

console.log("Bot Started");