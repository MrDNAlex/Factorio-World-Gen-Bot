import { BotData } from "dna-discord-framework";
import Player from "./Player";
import FactorioServerBotDataManager from "../FactorioServerBotDataManager";
import fs from "fs";
import FactorioServerManager from "./FactorioServerManager";

class PlayerDatabase {
    public Players: Record<string, Player> = {};

    constructor(data?: any) {
        if (data && data.Players && typeof data.Players === "object") {
            for (const username in data.Players) {
                if (data.Players.hasOwnProperty(username)) {
                    this.Players[username] = new Player(data.Players[username]);
                }
            }
        } else
            this.Players = {};
    }

    public AddNewPlayer(username: string) {
        const newPlayer = {
            Username: username,
            LoginTimeStamps: [],
            DisconnectTimeStamps: []
        }

        if (!(username in this.Players))
            this.Players[username] = new Player(newPlayer);
    }

    public AddLogin(username: string, loginTime: number) {
        if (username in this.Players)
            this.Players[username].AddLogin(loginTime);
    }

    public AddDisconnect(username: string, disconnectTime: number) {
        if (username in this.Players)
            this.Players[username].AddDisconnect(disconnectTime);
    }

    public Update() {
        let dataManager = BotData.Instance(FactorioServerBotDataManager);

        if (!fs.existsSync(FactorioServerManager.ServerLogs))
            return;

        const lines = fs.readFileSync(FactorioServerManager.ServerLogs, 'utf8').split("\n");
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

    public GetOnlinePlayers() {
        let onlinePlayers = [];

        for (const player in this.Players) {
            if (this.Players[player].IsOnline())
                onlinePlayers.push(player);
        }

        return onlinePlayers
    }

    public GetOfflinePlayers() {
        let offlinePlayers = [];

        for (const player in this.Players) {
            if (!this.Players[player].IsOnline())
                offlinePlayers.push(player);
        }

        return offlinePlayers;
    }

    public ResetDB() {
        this.Players = {};
    }
}

export default PlayerDatabase;