import { Vault, TFile } from "obsidian";
import {v4 as uuidv4} from 'uuid'

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

// Converts a non-note file into a note. 
// For pre-existing notes it shouldn't do anything
export async function convertToNote(vault: Vault, file: TFile) {
    await addUniqueIdToNote(vault, file);
    /** TODO: Create note history file if 
     * - not exists yet
     **/
    // TODO: Track changes
}


export async function addUniqueIdToNote(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    
    // TODO:  Add a check to see if the file already has an id
    const marker = "---"
    if (!content.startsWith(marker)) {
        const newContent = `${marker}\n id:${uuidv4()}\n${marker}\n${content}`
        await vault.modify(file, newContent);
    }
}