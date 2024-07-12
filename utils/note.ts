import { Vault, TFile, Notice } from "obsidian";
import {v4 as uuidv4} from 'uuid'
import { createNewFile } from "./file";

const marker = "---"

export async function handleNoteChange(vault: Vault, file: TFile | null) {
    if (!file) return;
    const isNote = await checkIfNote(vault, file);
    console.log("isnote", isNote);

}

export async function checkIfNote(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    const marker = "---"
    return content.startsWith(marker);

}

export function generateNoteRevisionName(id: string) {
    return `${id}_${new Date().toISOString().split('T')[0]}`;
}

// Converts a non-note file into a note. 
// For pre-existing notes it shouldn't do anything
export async function convertToNote(vault: Vault, file: TFile) {
    const id = await addUniqueIdToNote(vault, file);
    if (!id) {
        new Notice("File is already a note!")
        return;
    }

    /** TODO: Create note history file if 
     * - not exists yet
     **/
    const originalContent = await vault.read(file);
    const noteRevisionName = generateNoteRevisionName(id)
    await createNewFile(vault, noteRevisionName, originalContent);

    // TODO: Track changes
}

export async function readNoteId(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    if (content.startsWith(marker)) {
        const lines = content.split("\n");
        const idLine = lines.find(line => line.trim().includes("id:"))
        if (idLine) {
            return idLine.split(":")[1].trim();
        }
    }
    return null;
}

export async function addUniqueIdToNote(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    
    const id = uuidv4();
    if (!content.startsWith(marker)) {
        const newContent = `${marker}\n id:${id}\n${marker}\n${content}`
        await vault.modify(file, newContent);
        return id
    } else {
        return null
    }
}

export async function createNewNoteRevision(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    const id = await readNoteId(vault, file);
    if (!id) {
        new Notice("No id found in note")
        return;
    }

    const newContent = `${marker}\n id:${id}\n${marker}\n${content}`

    await vault.modify(file, newContent);
    new Notice("Note revision created")
}