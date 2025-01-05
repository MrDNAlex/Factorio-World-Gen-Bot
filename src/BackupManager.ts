import { BashScriptRunner, IBotDataManager } from "dna-discord-framework";
import fs from "fs";

class BackupManager {

    /**
     * Directory to Store and Manage Extra Backups
     */
    ExtraBackupsDir: string;

    /**
     * Directory to Store the Main Backup
     */
    BackupDir: string;

    /**
     * Directory of the Content to Backup
     */
    ContentDir: string;

    constructor(backupDir: string, extraBackupsDir: string, contentDir: string)
    {
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
    public async CreateBackup<T extends IBotDataManager>(dataManager: T, backupName: string = "Backup"): Promise<boolean> {
        let runner = new BashScriptRunner();
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
    private GetOldestBackupFile(): string {

        let files = fs.readdirSync(this.ExtraBackupsDir);

        if (files.length == 0)
            return "";

        files = files.map(filename => {
            const filePath = `${this.ExtraBackupsDir}/${filename}`;
            return {
                name: filename,
                time: fs.statSync(filePath).mtime.getTime()
            };
        }).sort((a, b) => a.time - b.time) // Sort files from oldest to newest
            .map(file => file.name);

        return files[0];
    }

    /**
     * Manages Backups Files by deleting oldest files until the maxBackups is reached
     * @param maxBackups The max number of extra backups to keep
     */
    public ManageBackupFiles(maxBackups: number): void {
        let maxLoop = 0;
        while (fs.readdirSync(this.ExtraBackupsDir).length > maxBackups && maxLoop < 50) {
            maxLoop++;
            let oldestFile = this.GetOldestBackupFile();
            if (oldestFile != "")
                fs.unlinkSync(`${this.ExtraBackupsDir}/${oldestFile}`);
        }
    }
}

export default BackupManager;