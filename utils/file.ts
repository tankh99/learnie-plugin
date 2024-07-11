import { Notice, TFile, Vault } from "obsidian"

const BASE_FOLDER_PATH = "_Learnie History"

export async function createNewFile(vault: Vault) {
    const folderPath = BASE_FOLDER_PATH
    const fileName = `file_history_${new Date().toISOString().split('T')[0]}.md`
    const filePath = `${folderPath}/${fileName}`;
    const folder = vault.getAbstractFileByPath(folderPath)
    if (!folder) {
        vault.createFolder(folderPath)
    }

    let file: TFile;
    try {
        file = await vault.create(filePath, "")
        new Notice(`File created: ${file.name}`)
    } catch (err) {
        console.error(err);
        new Notice(`Error creating file: ${err}`)
    }

}