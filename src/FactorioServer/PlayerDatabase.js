"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const Player_1 = __importDefault(require("./Player"));
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const fs_1 = __importDefault(require("fs"));
const FactorioServerManager_1 = __importDefault(require("./FactorioServerManager"));
class PlayerDatabase {
    constructor(data) {
        this.Players = {};
        if (data && data.Players && typeof data.Players === "object") {
            for (const username in data.Players) {
                if (data.Players.hasOwnProperty(username)) {
                    this.Players[username] = new Player_1.default(data.Players[username]);
                }
            }
        }
        else
            this.Players = {};
    }
    AddNewPlayer(username) {
        const newPlayer = {
            Username: username,
            LoginTimeStamps: [],
            DisconnectTimeStamps: []
        };
        if (!(username in this.Players))
            this.Players[username] = new Player_1.default(newPlayer);
    }
    AddLogin(username, loginTime) {
        if (username in this.Players)
            this.Players[username].AddLogin(loginTime);
    }
    AddDisconnect(username, disconnectTime) {
        if (username in this.Players)
            this.Players[username].AddDisconnect(disconnectTime);
    }
    Update() {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        if (!fs_1.default.existsSync(FactorioServerManager_1.default.ServerLogs))
            return;
        const lines = fs_1.default.readFileSync(FactorioServerManager_1.default.ServerLogs, 'utf8').split("\n");
        const joins = lines.filter((line) => line.includes("[JOIN]"));
        const leaves = lines.filter((line) => line.includes("[LEAVE]"));
        joins.forEach((join) => {
            const joinLine = join.split("[JOIN]");
            const timeStamp = joinLine[0].replace("[JOIN]", "").trim();
            const username = joinLine[1].replace(" joined the game", "").trim();
            this.AddNewPlayer(username);
            this.AddLogin(username, new Date(timeStamp).getTime());
        });
        leaves.forEach((leave) => {
            const leaveLine = leave.split("[LEAVE]");
            const timeStamp = leaveLine[0].replace("[LEAVE]", "").trim();
            const username = leaveLine[1].replace(" left the game", "").trim();
            this.AddDisconnect(username, new Date(timeStamp).getTime());
        });
    }
    GetOnlinePlayers() {
        let onlinePlayers = [];
        for (const player in this.Players) {
            if (this.Players[player].IsOnline())
                onlinePlayers.push(player);
        }
        return onlinePlayers;
    }
    GetOfflinePlayers() {
        let offlinePlayers = [];
        for (const player in this.Players) {
            if (!this.Players[player].IsOnline())
                offlinePlayers.push(player);
        }
        return offlinePlayers;
    }
    ResetDB() {
        this.Players = {};
    }
}
exports.default = PlayerDatabase;
