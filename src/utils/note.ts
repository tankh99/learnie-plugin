import { FrontmatterContent } from './../../node_modules/@types/mdast/index.d';
import { Vault, TFile, Notice } from "obsidian";
import {v4 as uuidv4} from 'uuid'
import { checkIfDerivativeFileIsValid, createNewFile, deleteFile, getFile, modifyFile, modifyFrontmatter, readFileContent, readFrontmatter } from "./file";
import { checkIfNoteRevision, createNoteRevision, generateNoteRevisionName, getAllNoteRevisions as getAllNoteRevisionFiles, getLatestNoteRevision, getNoteRevisionDate } from "./noteRevisions";
import { differenceInDays, endOfDay, isAfter, isBefore, startOfDay } from "date-fns";
import { formatLink, formatRelativeLink } from './obsidian-utils';
import { NoteMetadata } from 'types/types';
import { createQuestion, getAllQuestionFiles, QUESTION_FOLDER_PATH } from './questions';
import { Commands } from 'src/commands';

export const idMarker = "---"
export const NOTE_FOLDER_PATH = "_Learnie History"

export async function handleNoteChange(vault: Vault, file: TFile | null) {
    if (!file) return;
    if (!isValidNotePath(file.path)) return;
    const noteId = await readNoteId(vault, file);
    if (!noteId) return;

    const isNoteRevision = await checkIfNoteRevision(file);
    if (isNoteRevision) return;

    const latestNoteRevision = await getLatestNoteRevision(vault, noteId);
    if (!latestNoteRevision) {
        new Notice("Creating a new note revision")
        await createNoteRevision(vault, noteId, file, true);
        return;
    }

    const revisionContent = await vault.read(latestNoteRevision);
    const reviewed = await checkIfReviewed(revisionContent)
    const noteRevisionDate = getNoteRevisionDate(latestNoteRevision.name);
    const today = startOfDay(new Date());

    const canCreateNewRevision = isBefore(noteRevisionDate, today) && reviewed;
    if (canCreateNewRevision) {
        new Notice("Creating a new note revision")
        await createNoteRevision(vault, noteId, file, true);
        if (reviewed) {

            new Notice("Note is reviewed")
            // Delete the old one, we no longer need it.
            await deleteFile(vault, latestNoteRevision);
        }
    }
    // console.log(reviewed);
}

// Checks a note's frontmatter to see if it has been reviewed already or not
export async function checkIfReviewed(content: string) {
    const frontmatter = readFrontmatter(content);

    return frontmatter["reviewed"] ?? false
}
// Converts a non-note file into a note. 
// For pre-existing notes it shouldn't do anything
export async function convertToNote(vault: Vault, file: TFile) {
    const noteId = uuidv4()

    if (!isValidNotePath(file.path)) {
        new Notice("This file cannot be converted to a note")
        return;
    }
    /** TODO: Create note history file if 
     * - not exists yet
     **/
    // const content = await vault.read(file);
    const noteRevision = await createNoteRevision(vault, noteId, file);

    if (!noteRevision) {
        console.error(`Error creating note revision for ${file.name}`)
        return;
    }

    const questionFile = await createQuestion(noteId, file.path, "", "");
    if (!questionFile) {
        console.error(`Error creating question file for ${file.name}`)
        return;
    }

    const formattedReviewLink = `obsidian://${Commands.SHOW_DIFF}`
    const formattedQuestionLink = `obsidian://${Commands.VIEW_QUESTIONS}?file=${encodeURIComponent(questionFile.path)}`

    const metadata: NoteMetadata = {
        id: noteId,
        reviewLink: formattedReviewLink,
        questionsLink: formattedQuestionLink
    
    }
    await addMetadataToNote(vault, file, metadata);
}

export async function readNoteId(vault: Vault, file: TFile): Promise<string | null> {
    const fileContent = await vault.read(file)
    const frontmatter = readFrontmatter(fileContent);

    return frontmatter ? frontmatter["id"] : null;
}

export function extractContentFromNote(content: string) {
    const lines = content.split("\n");
    // Skip the first 3 lines, which is usually the id line
    // TODO: Check if any line breaks will fuck this up
    const contentLines = lines.slice(3, lines.length);
    return contentLines.join("\n");
}

export async function addMetadataToNote(vault: Vault, file: TFile, metadata: NoteMetadata) {
    modifyFrontmatter(file, metadata)
}

export async function noteIsChanged(file: TFile) {
    const today = startOfDay(new Date());
    const fileStats = await this.app.vault.adapter.stat(file.path);
    const lastModified = fileStats!.mtime;

    const {frontmatter} = await readFileContent(file)
    const isReviewed = frontmatter["reviewed"]

    const withinToday = differenceInDays(lastModified, today) >= 0;
    return withinToday && !isReviewed
}

/**
 * Function: 
 * 1. Scrape all IDs from every file in the vault and separate them into 2 arrays: one to store note ids, another to store generated note ids
 * 2. Get the set difference and delete all note revisions/questions with IDs that don't belog on the noteIds array
 * 
 */
export async function deleteAllUnusedNoteRevisionFiles() {
    const vault: Vault = this.app.vault;
    const files = await vault.getMarkdownFiles();
    
    const noteIds: string[] = []
    const generatedFiles: TFile[] = [];
    const filesToDelete = [];

    for (const file of files) {
        
        if (isValidNotePath(file.path)) {
            const id = await readNoteId(vault, file);
            if (!id) continue;
            noteIds.push(id);
        } else {
            const id = await readNoteId(vault, file);
            // If we cannot read the Id of tehe generated note, it means the generated file is not valid
            if (!id) {
                filesToDelete.push(file)
            } else {
                generatedFiles.push(file);
            }
        }
    }

    
    

    for (const file of generatedFiles) {
        const generatedFileId = await readNoteId(vault, file);
        console.log
        if (!generatedFileId) continue;
        if (!noteIds.some(noteId => noteId === generatedFileId)) {
            filesToDelete.push(file)
        }
    }

    for (const file of filesToDelete) {
        console.log("deleting", file.path)
        await vault.delete(file);
    }
}

/**
 * A valid note is any note that is not under the plugin's generated folders
 */
export function isValidNotePath(filePath: string) {
    return !filePath.startsWith(NOTE_FOLDER_PATH) && !filePath.startsWith(QUESTION_FOLDER_PATH)
}