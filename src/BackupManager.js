"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dna_discord_framework_1 = require("dna-discord-framework");
const fs_1 = __importDefault(require("fs"));
class BackupManager {
    constructor(backupDir, extraBackupsDir, contentDir) {
        this.BackupDir = backupDir;
        this.ExtraBackupsDir = extraBackupsDir;
        this.ContentDir = contentDir;
    }
    /**
     * Creates a New Tar.gz Backup of the Server
     * @param dataManager Data Manager to Log Errors
     * @param backupName Name of the Backup File (Default: Backup)
     * @returns Success Status of Backup Creation
     */
    async CreateBackup(dataManager, backupName = "Backup") {
        let runner = new dna_discord_framework_1.BashScriptRunner();
        let success = true;
        let backupFilePath = `${this.BackupDir}/${backupName}.tar.gz`;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        let extraBackupFilePath = `${this.ExtraBackupsDir}/${backupName}_${year}_${month}_${day}_${hour}_${min}.tar.gz`;
        await runner.RunLocally(`cd ${this.ContentDir} && tar -czvf ${backupFilePath} ./*`, true).catch((err) => {
            success = false;
            dataManager.AddErrorLog(err);
            console.log("Error creating backup");
        });
        await runner.RunLocally(`cp ${backupFilePath} ${extraBackupFilePath}`, true).catch((err) => {
            success = false;
            dataManager.AddErrorLog(err);
            console.log("Error creating backup copy");
        });
        return success;
    }
    /**
     * Gets all the Backup Files in the Extra Backup Directory Sorted from Oldest to Newest
     * @returns List of Backup Files Sorted from Oldest to Newest
     */
    GetOldestBackupFile() {
        let files = fs_1.default.readdirSync(this.ExtraBackupsDir);
        if (files.length == 0)
            return "";
        files = files.map(filename => {
            const filePath = `${this.ExtraBackupsDir}/${filename}`;
            return {
                name: filename,
                time: fs_1.default.statSync(filePath).mtime.getTime()
            };
        }).sort((a, b) => a.time - b.time) // Sort files from oldest to newest
            .map(file => file.name);
        return files[0];
    }
    /**
     * Manages Backups Files by deleting oldest files until the maxBackups is reached
     * @param maxBackups The max number of extra backups to keep
     */
    ManageBackupFiles(maxBackups) {
        let maxLoop = 0;
        while (fs_1.default.readdirSync(this.ExtraBackupsDir).length > maxBackups && maxLoop < 50) {
            maxLoop++;
            let oldestFile = this.GetOldestBackupFile();
            if (oldestFile != "")
                fs_1.default.unlinkSync(`${this.ExtraBackupsDir}/${oldestFile}`);
        }
    }
}
exports.default = BackupManager;
