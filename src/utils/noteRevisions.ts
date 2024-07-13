import { Notice, Vault } from "obsidian";
import { BASE_FOLDER_PATH } from "./file";

export function getNoteRevisionFileName(noteId: string) {
    const date = new Date().toISOString().split("T")[0];
    return `${noteId}_${date}.md`;
}

export async function getLatestNoteRevision(vault: Vault, noteId: string) {
    const folderPath = BASE_FOLDER_PATH;
    const files = vault.getFiles().filter(file => file.path.startsWith(folderPath));

    const matchedFiles = files.filter(file => {
        return file.name.startsWith(noteId);
    })

    if (matchedFiles.length === 0) {
        new Notice(`No files found with ID ${noteId}`)
        return null;
    }

    const latestNoteRevision = matchedFiles.reduce((prev, current) => {
        const [, latestDate] = prev.name.split("_");
        const [, currentDate] = current.name.split("_");

        return currentDate > latestDate ? current : prev
    })

    return latestNoteRevision;
}

// export async function showNoteDiff(vault: Vault, filePath: string) {

//     const currentNote = await vault.getAbstractFileByPath(`${BASE_FOLDER_PATH}/${noteId}.md`);
//     const noteRevision = await getLatestNoteRevision(vault, noteId);
//     if (!noteRevision) {
//         new Notice(`No file found with ID ${noteId}`)
//         return;
//     }

//     const currentContent

// }