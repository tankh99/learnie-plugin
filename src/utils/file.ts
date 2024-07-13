import { Notice, TFile, Vault } from "obsidian"

export const BASE_FOLDER_PATH = "_Learnie History"

export async function createNewFile(vault: Vault, filename: string, content: string) {
    const folderPath = BASE_FOLDER_PATH
    const fileName = `${filename}.md`
    const filePath = `${folderPath}/${fileName}`;
    const folder = vault.getAbstractFileByPath(folderPath)
    if (!folder) {
        vault.createFolder(folderPath)
    }

    let file: TFile;
    try {
        file = await vault.create(filePath, content)
        new Notice(`File created: ${file.name}`)
    } catch (err) {
        console.error(err);
        new Notice(`Error creating file: ${err}`)
    }

}

export async function deleteFile(vault: Vault, file: TFile) {
    try {
        await vault.delete(file)
        new Notice(`File deleted: ${file.name}`)
    } catch (err) {
        console.error(err);
        new Notice(`Error deleting file: ${err}`)
    }
}