import { Notice, Vault } from "obsidian";
import { BASE_FOLDER_PATH, createNewFile, modifyFile } from "./file";
import { addIdToNote } from "./note";

export async function createNoteRevision(vault: Vault, noteId: string, originalContent: string, isNew = true) {
    const noteRevisionName = generateNoteRevisionName(noteId)
    const createdFile = await createNewFile(vault, noteRevisionName, originalContent);
    if (!createdFile) {
        console.error(`Error creating file ${noteRevisionName}`)
        return;
    }
    if (isNew) {
        const newContent = await addIdToNote(vault, createdFile, noteId);
        console.info("Added id to note")
    }
}

export function getNoteRevisionFileName(noteId: string) {
    const date = new Date().toISOString().split("T")[0];
    return `${noteId}_${date}.md`;
}

export function getNoteRevisionDate(name: string) {
    // Separate the ID, and the .md extension
    const dateStr = name.split("_")[1].split(".")[0]
    console.log(dateStr);
    return new Date(dateStr);
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
export function generateNoteRevisionName(id: string) {
    return `${id}_${new Date().toISOString().split('T')[0]}`;
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