import fs, { write } from "fs";
import os from "os";
import path from "path";

export type Config = {
    dbUrl: string;
    currentUserName: string;
}


export function setUser(userName: string) {
    const cfg = readConfig()
    const updatedCfg = { ...cfg, currentUserName: userName };

    writeConfig(updatedCfg)
}

export function readConfig(): Config {
    const file = fs.readFileSync(getConfigFilePath(), "utf8")
    const parsedFile = JSON.parse(file)

    const validatedFile = validateConfig(parsedFile)

    return validatedFile
}

/* 
Helper Functions:
   These functions are used in conjunction with setUser() and readConfig()
        - getConfigFilePath(): used for retrieving the file path of the main json config file (in this case .gatorconfig.json) | found in: readConfig()
        - writeConfig(): used for writing to the main json config once a username has been passed | found in: setUser()
        - validateConfig(): used for validating the results of JSON.parse to ensure correct structure | found in: readConfig()
*/

function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
    const rawConfig = {
        db_url: cfg.dbUrl,
        current_user_name: cfg.currentUserName
    }

    const jsonData = JSON.stringify(rawConfig, null, 2)

    fs.writeFileSync(getConfigFilePath(), jsonData)
}

function validateConfig(rawConfig: any): Config {
    
    if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
        throw new Error("Database Url Required")
    }

    return {
        dbUrl: rawConfig.db_url,
        currentUserName: rawConfig.current_user_name ?? ""
    }
}