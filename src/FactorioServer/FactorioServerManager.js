"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const PlayerDatabase_1 = __importDefault(require("./PlayerDatabase"));
const FactorioServerBotDataManager_1 = __importDefault(require("../FactorioServerBotDataManager"));
const fs_1 = __importDefault(require("fs"));
const BackupManager_1 = __importDefault(require("../BackupManager"));
const FactorioExecutableCommands_1 = __importDefault(require("../Enums/FactorioExecutableCommands"));
1;
class FactorioServerManager {
    constructor(data) {
        /**
         * Time to Wait for Server Actions
         */
        this.ActionWaitTime = 3000;
        if (data) {
            this.Name = data.Name;
            this.WorldChosen = data.WorldChosen;
            this.PlayerDB = new PlayerDatabase_1.default(data.PlayerDB);
            this.StartTime = data.StartTime;
            this.WorldSeed = data.WorldSeed;
            this.WorldDirectory = data.WorldDirectory;
            this.WorldSettings = data.WorldSettings;
            this.WorldImage = data.WorldImage;
            this.WorldFile = data.WorldFile;
            this.WorldImageSize = data.WorldImageSize;
            this.WorldInfo = data.WorldInfo;
        }
        else {
            this.Name = "Factorio Server";
            this.StartTime = 0;
            this.WorldChosen = false;
            this.PlayerDB = new PlayerDatabase_1.default();
            this.WorldSeed = 0;
            this.WorldDirectory = "";
            this.WorldSettings = "";
            this.WorldImage = "";
            this.WorldFile = "";
            this.WorldInfo = "";
            this.WorldImageSize = 0;
        }
    }
    AllFilesExist() {
        return fs_1.default.existsSync(this.WorldSettings) && fs_1.default.existsSync(this.WorldInfo) && fs_1.default.existsSync(this.WorldImage) && fs_1.default.existsSync(this.WorldFile);
    }
    /**
     * Pings the Factorio Server to see if it is online
     * @returns Returns a Boolean Flag | True if the Server is Online, False if the Server is Offline
     */
    async IsOnline() {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let serverStatus = new dna_discord_framework_1.BashScriptRunner();
        let ranIntoError = false;
        let isServerRunningCommand = `pgrep -f "factorio ${FactorioExecutableCommands_1.default.StartServer} ${FactorioServerManager.WorldFilePath}"`;
        await serverStatus.RunLocally(isServerRunningCommand, true).catch((err) => {
            ranIntoError = true;
            dataManager.AddErrorLog(err);
            console.log(`Error Checking Server Status : ${err}`);
        });
        let IDs = serverStatus.StandardOutputLogs.split("\n");
        IDs.forEach((id) => {
            id = id.trim();
        });
        IDs = IDs.filter((id) => id != " " && id != "");
        if (ranIntoError || IDs.length <= 1)
            return false;
        return true;
    }
    /**
     * Starts the Factorio Server
     * @returns Returns a Boolean Flag | True if the Server was Started, False if the Server was not Started
     */
    async Start() {
        let start = new dna_discord_framework_1.BashScriptRunner();
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let startCommand = `factorio ${FactorioExecutableCommands_1.default.StartServer} ${FactorioServerManager.WorldFilePath} --port ${dataManager.SERVER_PORT} > ${FactorioServerManager.ServerLogs} 2>&1 &`;
        let success = true;
        start.RunLocally(startCommand, true).catch((err) => {
            if (err.code === undefined)
                return;
            success = false;
            console.log("Error starting server");
            console.log(err);
        });
        return new Promise(resolve => setTimeout(() => {
            if (success)
                this.StartTime = new Date().getTime();
            resolve(success);
        }, this.ActionWaitTime));
    }
    /**
     * Tries to Shutdown the Factorio Server
     * @returns Returns a Boolean Flag | True if the Server was Shutdown, False if the Server was not Shutdown
     */
    async Shutdown() {
        let shutdown = new dna_discord_framework_1.BashScriptRunner();
        let shutdownCommand = `pkill -f "factorio --start-server" || true`;
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let success = true;
        await shutdown.RunLocally(shutdownCommand, true).catch((err) => {
            if (err.code === undefined)
                return;
            success = false;
            dataManager.AddErrorLog(err);
        });
        return new Promise(resolve => setTimeout(() => resolve(success), this.ActionWaitTime));
    }
    /**
     * Gets the List of Online Players in the Factorio Server
     */
    GetPlayers() {
        const lines = fs_1.default.readFileSync(FactorioServerManager.ServerLogs, 'utf8').split("\n");
        const joins = lines.filter((line) => line.includes("[JOIN]"));
        const leaves = lines.filter((line) => line.includes("[LEAVE]"));
        joins.forEach((join) => {
            const joinLine = join.split("[JOIN]");
            const timeStamp = joinLine[0].replace("[JOIN]", "").trim();
            const username = joinLine[1].replace(" joined the game", "").trim();
            this.PlayerDB.AddNewPlayer(username);
            this.PlayerDB.AddLogin(username, new Date(timeStamp).getTime());
        });
        leaves.forEach((leave) => {
            const leaveLine = leave.split("[LEAVE]");
            const timeStamp = leaveLine[0].replace("[LEAVE]", "").trim();
            const username = leaveLine[1].replace(" left the game", "").trim();
            this.PlayerDB.AddDisconnect(username, new Date(timeStamp).getTime());
        });
        this.PlayerDB.Update();
        return this.PlayerDB.GetOnlinePlayers();
    }
    /**
     * Copies the World Files to the Backup Directory
     * @returns Returns a Boolean Flag | True if the Backup was Successful, False if the Backup was Unsuccessful
     */
    async Backup() {
        let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
        let backupManager = new BackupManager_1.default(FactorioServerManager.BackupDirectory, FactorioServerManager.ExtraBackupDirectory, FactorioServerManager.WorldDirectory);
        let backupSuccess = await backupManager.CreateBackup(dataManager, "Backup");
        backupManager.ManageBackupFiles(5);
        dataManager.LAST_BACKUP_DATE = new Date().getTime();
        return backupSuccess;
    }
    static async AutoBackup() {
        let Mins10 = 1000 * 60 * 10;
        let shouldContinue = true;
        const handleExit = () => {
            shouldContinue = false;
            console.log("Shutting down...");
        };
        process.on('SIGINT', handleExit); // Handle Ctrl+C
        process.on('SIGTERM', handleExit); // Handle Docker stop
        while (shouldContinue) {
            let dataManager = dna_discord_framework_1.BotData.Instance(FactorioServerBotDataManager_1.default);
            let serverManager = dataManager.SERVER_MANAGER;
            if (await serverManager.IsOnline() && !await serverManager.Backup())
                console.log("Error creating backup");
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, Mins10);
                const checkExit = () => {
                    if (!shouldContinue) {
                        clearTimeout(timeout);
                        resolve;
                    }
                    else
                        setImmediate(checkExit);
                };
                checkExit();
            });
        }
    }
    SaveWorldInfo(isGlobal) {
        if (isGlobal)
            fs_1.default.writeFileSync(FactorioServerManager.WorldInfoPath, JSON.stringify(this, null, 4));
        else
            fs_1.default.writeFileSync(this.WorldInfo, JSON.stringify(this, null, 4));
    }
}
// Files
FactorioServerManager.WorldDirectory = "/home/factorio/World";
FactorioServerManager.WorldImagePath = "/home/factorio/World/Preview.png";
FactorioServerManager.WorldFilePath = "/home/factorio/World/World.zip";
FactorioServerManager.WorldSettingsPath = "/home/factorio/World/MapGenSettings.json";
FactorioServerManager.WorldInfoPath = "/home/factorio/World/WorldInfo.json";
FactorioServerManager.BackupDirectory = "/home/factorio/Backups";
FactorioServerManager.ExtraBackupDirectory = "/home/factorio/Backups/Extras";
FactorioServerManager.BackupFile = "/home/factorio/Backups/Backup.tar.gz";
FactorioServerManager.PreviewDirectory = "/home/factorio/Previews";
FactorioServerManager.ServerLogs = "/home/factorio/World/WORLD_LOG.txt";
FactorioServerManager.MapGenTemplate = "/FactorioBot/src/Files/MapGenTemplate.json";
exports.default = FactorioServerManager;
