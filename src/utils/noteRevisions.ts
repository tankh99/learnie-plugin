import { Notice, TFile, Vault } from "obsidian";
import { createNewFile, modifyFile, readContentWithoutFrontmatter, readFileContent, readFrontmatter } from "./file";
import { addMetadataToNote, NOTE_FOLDER_PATH } from "./note";
import {toZonedTime} from 'date-fns-tz';
import { getDatePart } from "./date";
import { NoteMetadata } from "types/types";

export async function checkIfNoteRevision(file: TFile) {
    const {frontmatter} = await readFileContent(file);
    if (!frontmatter) {
        console.log("No frontmatter found")
        return false;
    }
    return "reviewed" in frontmatter;
}

export async function createNoteRevision(vault: Vault, noteId: string, originalContent: string, isNew = true) {
    const noteRevisionName = generateNoteRevisionName(noteId)
    const originalContentWithoutFrontmatter = readContentWithoutFrontmatter(originalContent);
    const folderPath = NOTE_FOLDER_PATH
    const createdFile = await createNewFile(vault, folderPath, noteRevisionName, originalContentWithoutFrontmatter);

    if (!createdFile) {
        console.error(`Error creating file ${noteRevisionName}`)
        return;
    }
    if (isNew) {
        const metadata: NoteMetadata = {
            id: noteId,
            reviewed: false
        }
        await addMetadataToNote(vault, createdFile, metadata);
        console.info("Added id to note")
        return createdFile
    }
    return null;
}

export function getNoteRevisionFileName(noteId: string) {
    const datePart = getDatePart(new Date())
    return `${noteId}_${datePart}.md`;
}

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

export async function getLatestNoteRevision(vault: Vault, noteId: string) {
    const folderPath = NOTE_FOLDER_PATH;
    const files = vault.getFiles().filter(file => file.path.startsWith(folderPath));

    const matches = await Promise.all(files.map(async (file) => {
        const fileContent = await vault.read(file);
        // console.log(fileContent)
        const frontmatter = readFrontmatter(fileContent);
        const result = frontmatter["id"] === noteId 
            && "reviewed" in frontmatter 
            && frontmatter["reviewed"] === false;
        return result ? file : null;
    }));

    const matchedFiles = matches.filter(file => file != null)

    if (matchedFiles.length === 0) {
        new Notice(`No files found with ID ${noteId} or they are already reviewed.`)
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
