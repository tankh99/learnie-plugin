import { FrontmatterContent } from './../../node_modules/@types/mdast/index.d';
import { Vault, TFile, Notice } from "obsidian";
import {v4 as uuidv4} from 'uuid'
import { checkIfDerivativeFileIsValid, createNewFile, deleteFile, getFile, modifyFile, modifyFrontmatter, readFileContent, readFrontmatter } from "./file";
import { checkIfNoteRevision, createNoteRevision, generateNoteRevisionName, getAllNoteRevisions as getAllNoteRevisionFiles, getLatestNoteRevision, getNoteRevisionDate } from "./noteRevisions";
import { differenceInDays, endOfDay, isAfter, isBefore, startOfDay } from "date-fns";
import { formatLink, formatRelativeLink } from './obsidian-utils';
import { NoteMetadata } from 'types/types';
import { QUESTIONS_VIEW } from 'src/views/qns-view';
import { createQuestion } from './questions';

export const idMarker = "---"
export const NOTE_FOLDER_PATH = "_Learnie History"

export async function handleNoteChange(vault: Vault, file: TFile | null) {
    if (!file) return;

    const noteId = await readNoteId(vault, file);
    if (!noteId) return;

    const isNoteRevision = await checkIfNoteRevision(file);
    if (isNoteRevision) return;

    const latestNoteRevision = await getLatestNoteRevision(vault, noteId);
    if (!latestNoteRevision) {
        new Notice("Creating a new note revision")
        await createNoteRevision(vault, noteId, "", true);
        return;
    }

    const revisionContent = await vault.read(latestNoteRevision);
    const reviewed = await checkIfReviewed(revisionContent)
    if (reviewed) {
        new Notice("Note is reviewed")
    }
    const noteRevisionDate = getNoteRevisionDate(latestNoteRevision.name);
    const today = startOfDay(new Date());
    if (isBefore(noteRevisionDate, today)) {
        new Notice("Creating a new note revision")
        const originalContent = await vault.read(file);
        await createNoteRevision(vault, noteId, originalContent, true);
        // Delete the old one, we no longer need it.
        await deleteFile(vault, latestNoteRevision);
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

    /** TODO: Create note history file if 
     * - not exists yet
     **/
    const content = await vault.read(file);
    const noteRevision = await createNoteRevision(vault, noteId, content);

    if (!noteRevision) {
        console.error(`Error creating note revision for ${file.name}`)
        return;
    }

    const questionFile = await createQuestion(noteId, file.path, "", "");
    if (!questionFile) {
        console.error(`Error creating question file for ${file.name}`)
        return;
    }
    const link = noteRevision.path

    const metadata: NoteMetadata = {
        id: noteId,
        // link: formatRelativeLink(link, "View Revision")
        // questionsLink: `obsidian://view-questions?file=${encodeURIComponent(file.path)}`
        questionsLink: `[[obsidian://view-questions?path=${encodeURIComponent(questionFile.path)}]]`
    
    }
    await addMetadataToNote(vault, file, metadata);
}

export async function readNoteId(vault: Vault, file: TFile) {
    const fileContent = await vault.read(file)
    const frontmatter = readFrontmatter(fileContent);

    return frontmatter["id"];
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

export async function deleteAllUnusedNoteRevisionFiles() {
    const noteRevisions = await getAllNoteRevisionFiles();
    
    // checks each question file and see if a backlink is present. If it is, we assume that it is the
    // note referencing it and nothing else. 
    // TODO: In future, we could check to see if the backlink itself is a valid note and has a valid note id
    noteRevisions.forEach(async (file) => {
        const isValid = checkIfDerivativeFileIsValid(file);
        if (!isValid) {
            await deleteFile(this.app.vault, file)
        }
    })
}