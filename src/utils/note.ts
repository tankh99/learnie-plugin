import { Vault, TFile, Notice } from "obsidian";
import {v4 as uuidv4} from 'uuid'
import { createNewFile, deleteFile } from "./file";
import { createNoteRevision, generateNoteRevisionName, getLatestNoteRevision, getNoteRevisionDate } from "./noteRevisions";
import { endOfDay, isAfter, isBefore } from "date-fns";

export const idMarker = "---"

export async function handleNoteChange(vault: Vault, file: TFile | null) {
    if (!file) return;
    const isNote = await checkIfNote(vault, file);

    const noteId = await readNoteId(vault, file);
    if (!noteId) {
        new Notice("No id found in note")
        return;
    }
    const latestNoteRevision = await getLatestNoteRevision(vault, noteId);
    if (!latestNoteRevision) {
        new Notice("No latest note revision found")
        return;
    }

    const revisionContent = await vault.read(latestNoteRevision);
    const domParser = new DOMParser();

    const revisionDoc = domParser.parseFromString(revisionContent, "text/html");
    const reviewed = await checkIfReviewed(revisionDoc)
    if (reviewed) {
        new Notice("Note is reviewed")
    }
    const noteRevisionDate = getNoteRevisionDate(latestNoteRevision.name);
    const today = endOfDay(new Date());
    if (isBefore(noteRevisionDate, today)) {
        new Notice("Creating a new note revision")
        const originalContent = await vault.read(file);
        await createNoteRevision(vault, noteId, originalContent);
        // Delete the old one, we no longer need it.
        await deleteFile(vault, latestNoteRevision);
    }
    // console.log(reviewed);
}

export async function checkIfReviewed(document: Document) {
    const checkbox = document.getElementById("learnie-reviewed")
    if (!checkbox) {
        console.error("No checkbox found")
        return true;
    }

    const checked = (checkbox as HTMLInputElement).checked;
    return checked


}

export async function checkIfNote(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    return content.startsWith(idMarker);

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
    const content = await vault.read(file);
    await createNoteRevision(vault, id, content);

    // TODO: Track changes
}

export async function readNoteId(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    if (content.startsWith(idMarker)) {
        const lines = content.split("\n");
        const idLine = lines.find(line => line.trim().includes("id:"))
        if (idLine) {
            return idLine.split(":")[1].trim();
        }
    }
    return null;
}

export function extractContentFromNote(content: string) {
    const lines = content.split("\n");
    // Skip the first 3 lines, which is usually the id line
    // TODO: Check if any line breaks will fuck this up
    const contentLines = lines.slice(3, lines.length);
    return contentLines.join("\n");
}

export async function addUniqueIdToNote(vault: Vault, file: TFile) {
    const content = await vault.read(file);
    
    const id = uuidv4();
    if (!content.startsWith(idMarker)) {
        const newContent = `${idMarker}\n id:${id}\n${idMarker}\n${content}`
        await vault.modify(file, newContent);
        return id
    } else {
        return null
    }
}