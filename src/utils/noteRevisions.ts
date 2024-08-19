import { Notice, TFile, Vault, moment } from "obsidian";
import { NoteRevisionMetadata } from "../types/types";
import { getDatePart } from "./date";
import { createNewFile, NOTE_FOLDER_PATH, readContentWithoutFrontmatter, readFileContent, readFrontmatter } from "./file";
import { addMetadataToNoteRevision } from "./note";

/**
 * A note revision is considered to be reviewed only if it meetsh te following criteria:
 * 1. lastReviewed is >= start of today
 * 2. OR (*deprecated): reviewed is true
 * @param file 
 * @returns 
 */
export function checkIfNoteRevisionIsReviewed(file: TFile) {
    const frontmatter = readFrontmatter(file);
    if (!frontmatter) {
        return false;
    }
    if ("lastReviewed" in frontmatter) {
        const lastReviewed = moment(frontmatter["lastReviewed"])
        const startOfDay = moment().startOf("day");
        return lastReviewed.isAfter(startOfDay);
    } else {
        return frontmatter["revision"] ?? false;
    }
}

export async function checkIfNoteRevision(file: TFile) {
    const frontmatter = await readFrontmatter(file);
    if (!frontmatter) {
        // console.log("No frontmatter found")
        return false;
    }
    return "lastReviewed" in frontmatter || "reviewed" in frontmatter;
}

export async function createNoteRevision(vault: Vault, noteId: string, file: TFile, isNew = true) {
    const originalContent = await vault.read(file);
    const noteRevisionName = generateNoteRevisionName(noteId)
    const originalContentWithoutFrontmatter = readContentWithoutFrontmatter(originalContent);
    const folderPath = NOTE_FOLDER_PATH
    const createdFile = await createNewFile(vault, folderPath, noteRevisionName, originalContentWithoutFrontmatter);

    if (!createdFile) {
        console.error(`Error creating file ${noteRevisionName}`)
        return;
    }
    if (isNew) {
        const metadata: NoteRevisionMetadata = {
            id: noteId,
            // reviewed: false,
            noteLink: `[[${file.path}]]`,
            lastReviewed: undefined,
        }

        await addMetadataToNoteRevision(createdFile, metadata);
        return createdFile
    }
    return null;
}

/**
 * Generates a note revision file name given an id
 * @param noteId 
 * @returns 
 */
export function getNoteRevisionFileName(noteId: string) {
    // const datePart = getDatePart(new Date())
    // return `${noteId}_${datePart}.md`;
    return `${noteId}.md`;
}

/**
 * Gets the first note revision file that contains a note Id
 * @param noteId 
 */
export function getNoteRevisionByNoteId(noteId: string) {
    const vault: Vault = this.app.vault;
    const files = vault.getFiles().filter(file => file.path.startsWith(NOTE_FOLDER_PATH));
    const matches = files.filter(file => file.path.includes(noteId))[0];
    return matches;
}

// Get all files inside the note revisions folder
export function getAllNoteRevisions() {
    const vault: Vault = this.app.vault;
    const files = vault.getFiles().filter(file => file.path.startsWith(NOTE_FOLDER_PATH));
    return files;
}

export function getNoteRevisionDate(name: string) {
    // Separate the ID, and the .md extension
    const dateStr = name.split("_")[1].split(".")[0]
    return new Date(dateStr);
}

/**
 * Queries the note revisions folder to get the most recent note revision
 */
export async function getLatestNoteRevision(vault: Vault, noteId: string) {
    const folderPath = NOTE_FOLDER_PATH;
    const files = vault.getFiles().filter(file => file.path.startsWith(folderPath));

    const matches = await Promise.all(files.map(async (file) => {
        const frontmatter = readFrontmatter(file);
        if (frontmatter) {
            const result = frontmatter["id"] === noteId;
            return result ? file : null;
        }
    }));

    const matchedFiles = matches.filter(file => file != null)

    if (matchedFiles.length === 0) {
        new Notice(`No files found with ID ${noteId} or they are already reviewed. Try updating the note first.`)
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
    const datePart = getDatePart(new Date());
    return `${id}_${datePart}`;
}
