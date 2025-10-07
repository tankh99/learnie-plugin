import { normalizeTag } from 'src/utils/tags';
import { App, moment, Notice, TFile, Vault } from "obsidian";
import { Commands } from 'src/commands';
import { NoteMetadata, NoteRevisionMetadata } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { deleteFile, modifyFrontmatter, NOTE_REVISION_FOLDER_PATH, QUESTION_FOLDER_PATH, readFileContent, readFrontmatter } from "./file";
import { checkIfNoteRevisionIsReviewed, createNoteRevision, getLatestNoteRevision, getNoteRevisionByNoteId, getNoteRevisionDate } from "./noteRevisions";
import { createQuestion } from './questions';
import { formatDate } from "./date";

export const idMarker = "---"

export async function getAllNotes() {
    const app: App = this.app;
    const files = await app.vault.getMarkdownFiles();
    return files.filter(file => isValidNotePath(file.path));
}

export async function getNoteByNoteId(noteId: string) {
    const notes = await getAllNotes()
    for (const file of notes) {
        const frontmatter = readFrontmatter(file);
        if (frontmatter && frontmatter["id"] == noteId) {
            return file;
        }
    }
    return null;
}

/**
 * Gets all notes with specified tags in its frontmatter
 * @param tags 
 * @returns 
 */
export async function getNotesByTags(tags: Set<string>) {
    const files = await getAllNotes()
    const filesWithTags: TFile[] = []

    for (const file of files) {
        const fileCache = this.app.metadataCache.getFileCache(file);
        const frontmatter = fileCache.frontmatter;
        if (frontmatter && frontmatter.tags) {
            for (const tag of frontmatter.tags) {
                if (tags.has(normalizeTag(tag))) {
                    filesWithTags.push(file)
                }
            }
        }
    }

    return filesWithTags;
}

/**
 * On editing of a note, it checks to see if it needs to create  a new note revision given that the previous note 
 * revision:
 * 1. Doesn't exist OR
 * 2. Is already reviewed and it wasn't created today
 * 
 * It also creates a note revision if it doesn't already exist
 */
export async function handleNoteChange(vault: Vault, file: TFile | null) {
    if (!file) return;
    if (!isValidNotePath(file.path)) return;
    const noteId = await readNoteId(vault, file);
    if (!noteId) return;

    const isValidNote = isValidNotePath(file.path);
    if (!isValidNote) return;

    const latestNoteRevision = await getLatestNoteRevision(vault, noteId);
    // Creates a new note revision is there isn't any to begin with (this shouldn't normally occur)
    if (!latestNoteRevision) {
        new Notice("Creating a new note revision")
        await createNoteRevision(vault, noteId, file, true);
        return;
    }

    const revisionFrontmatter = readFrontmatter(latestNoteRevision);
    if (!revisionFrontmatter) {
        console.error(`Error reading frontmatter for ${latestNoteRevision.name}`)
        return;
    }

    if ("reviewed" in revisionFrontmatter) {
        /**
         * This condition block is for the DEPRECATED property "reviewed" 
         * We delete the old revision and recreate a new one
         */
        const isReviewed = checkIfNoteRevisionIsReviewed(latestNoteRevision);
        const noteRevisionDate = getNoteRevisionDate(latestNoteRevision.name);
        const today = moment().startOf("day");
    
        const canCreateNewRevision = moment(noteRevisionDate).isBefore(today) && isReviewed;
        // Handle creation of new note revision and deletion of old one (if it's already reviewed)
        if (canCreateNewRevision) {
            new Notice("Creating a new note revision")
            console.info("Creating a new revision");
            await createNoteRevision(vault, noteId, file, true);
            if (isReviewed) {
                // new Notice("Note is reviewed")
                // Delete the old one, we no longer need it.
                console.info(`Deleting old note revision ${latestNoteRevision.name}`)
                await deleteFile(vault, latestNoteRevision);
            }
        }
    } else {
        // We only modify and update if lastReviewed < today. then we set lastReviewed to today exactly
        const lastReviewed = revisionFrontmatter["lastReviewed"] 
            ? moment(revisionFrontmatter["lastReviewed"])
            : null;
        const today = moment().startOf("D");
        // If there is no lastReviewed property, create it
        const isReviewed = checkIfNoteRevisionIsReviewed(latestNoteRevision)
        if (!lastReviewed || (lastReviewed.isBefore(today) && isReviewed)) {
            const newFrontmatter = {
                ...revisionFrontmatter,
                lastReviewed: today,
            };
            const {content: newContent} = await readFileContent(file);
            await vault.modify(latestNoteRevision, newContent);
            modifyFrontmatter(latestNoteRevision, newFrontmatter);
        }
    }
}

// Converts a non-note file into a note. 
// For pre-existing notes it shouldn't do anything
export async function convertToNote(vault: Vault, file: TFile) {
    const noteId = uuidv4()

    if (!isValidNotePath(file.path)) {
        new Notice("This file cannot be converted to a note")
        return;
    }
    const noteRevision = await createNoteRevision(vault, noteId, file);

    if (!noteRevision) {
        console.error(`Error creating note revision for ${file.name}`)
        return;
    }

    const questionFile = await createQuestion(noteId, "", "", []);
    if (!questionFile) {
        console.error(`Error creating question file for ${file.name}`)
        return;
    }

    const formattedReviewLink = `obsidian://${Commands.SHOW_DIFF}`
    const formattedQuestionLink = `obsidian://${Commands.VIEW_QUESTIONS}?file=${encodeURIComponent(questionFile.path)}`

    const metadata: NoteMetadata = {
        id: noteId,
        reviewLink: formattedReviewLink,
        questionsLink: formattedQuestionLink,
        // TODO: Commenting so it doesn't nuke existing tags. Why was it added in the first place?
        // tags: []
    }
    await addMetadataToNote(vault, file, metadata);
}

export async function readNoteId(vault: Vault, file: TFile): Promise<string | null> {
    const frontmatter = readFrontmatter(file);

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

export async function addMetadataToNoteRevision(file: TFile, metadata: NoteRevisionMetadata) {
    modifyFrontmatter(file, metadata)
}

/**
 * checks if a file is considered changed by checking
 * 1. If the note itself has been modified today
 * 2. If the note revision associated with the file has not yet been reviewed 
 * @param file 
 * @returns 
 */
export async function noteIsChanged(file: TFile) {
    const today = moment().startOf("D")
    const frontmatter = readFrontmatter(file)
    const noteId = frontmatter["id"]
    const noteRevisionFile = getNoteRevisionByNoteId(noteId)
    const noteRevisionFrontmatter = await readFrontmatter(noteRevisionFile)
    const fileStats = await this.app.vault.adapter.stat(file.path);
    const lastModified = moment(fileStats.mtime);
    const withinToday = lastModified.isSameOrAfter(today); // WE can consider changing this variable to check wtihin a certain timeframe as well

    if ("reviewed" in noteRevisionFrontmatter) {
        /**
         * Legacy property: reviewed (boolean) is replaced with lastReviewed (date)
        */
       const isReviewed = noteRevisionFrontmatter["reviewed"]
       return withinToday || !isReviewed
    } else {
        const lastReviewed = noteRevisionFrontmatter["lastReviewed"] 
            ? moment(noteRevisionFrontmatter["lastReviewed"])
            : null;

        if (!lastReviewed) {
            console.error(`No lastReviewed found in note revision frontmatter for ${file.name}`)
            return false;
        }
        // const pastTodayButNotReviewedYet = lastReviewed && lastReviewed.isBefore(lastModified)
        
        const beforeTodayButNotReviewedYet = (lastReviewed.isBefore(lastModified))
        return withinToday || beforeTodayButNotReviewedYet
    }
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
        if (!generatedFileId) continue;
        if (!noteIds.some(noteId => noteId === generatedFileId)) {
            filesToDelete.push(file)
        }
    }

    for (const file of filesToDelete) {
        await deleteFile(vault, file);
    }
}

/**
 * A valid note is any note that is not under the plugin's generated folders, e.g. revisions and questions
 */
export function isValidNotePath(filePath: string) {
    return !filePath.startsWith(NOTE_REVISION_FOLDER_PATH) && !filePath.startsWith(QUESTION_FOLDER_PATH)
}