import { MetadataCache, Notice, TFile, Vault } from "obsidian";
import { checkIfDerivativeFileIsValid, createNewFile, deleteFile, getFile, modifyFrontmatter, readFileContent, readFrontmatter } from "./file";
import { formatRelativeLink } from "./obsidian-utils";
import { isValidNotePath } from "./note";


export const QUESTION_FOLDER_PATH = "_Learnie_Questions"

export function formatQuestionFilename(noteId: string) {
    return `${noteId}_question`
}

export function getAllQuestionFiles() {
    const vault: Vault = this.app.vault;
    const questions = vault.getFiles().filter((file: TFile) => file.path.startsWith(QUESTION_FOLDER_PATH));
    
    return questions;
}

export async function getQuestionFile(noteId: string) {
    // const vault = this.app.vault;
    const filename = formatQuestionFilename(noteId)
    const questionFile = await getFile(QUESTION_FOLDER_PATH, filename)
    return questionFile;
}

export async function getQuestions(noteId: string) {
    const vault = this.app.vault;
    const questionFile = await getQuestionFile(noteId)
    if (!questionFile) {
        console.error(`Question file not found for note: ${noteId}`)
        return null;
    }

    const questionContent = await vault.read(questionFile)
    const frontmatter = readFrontmatter(questionContent)
    return frontmatter["questions"]

}

export async function createQuestion(noteId: string, notePath: string, question: string, answer: string) {
    const vault = this.app.vault;

    const filename = formatQuestionFilename(noteId)
    const createdFile = await createNewFile(vault, QUESTION_FOLDER_PATH, filename, "")
    if (!createdFile) {
        console.error(`Error creating file: ${noteId}-question`)
        return;
    }

    const questions = []
    if (question && answer) {
        questions.push({ question, answer})
    }
    await modifyFrontmatter(createdFile, {
        questions: questions,
        // noteLink: `[[${notePath}]]`
    })
    return createdFile;
}

export async function addQuestion(noteId: string, file:TFile, question: string, answer: string) {
    const vault = this.app.vault;
    const filename = formatQuestionFilename(noteId)
    const questionFile = await getFile(QUESTION_FOLDER_PATH, filename)

    if (!isValidNotePath(file.path)) {
        new Notice("You cannot add questions to this file")
        return
    }
    if (!questionFile) {
        await createQuestion(noteId, file.path, question, answer)
        // await modifyFrontmatter(file, {"questionLink": formatRelativeLink(`${QUESTION_FOLDER_PATH}/${filename}.md`, "View Questions")})
        return;
    }

    const questionContent = await vault.read(questionFile)
    const frontmatter = readFrontmatter(questionContent)
    const questions = frontmatter["questions"] ?? []
    questions.push({ question, answer })
    await modifyFrontmatter(questionFile, { questions })
}

export async function deleteAllUnusedQuestionFiles() {
    const questions = await getAllQuestionFiles();
    // checks each question file and see if a backlink is present. If it is, we assume that it is the
    // note referencing it and nothing else. 
    // TODO: In future, we could check to see if the backlink itself is a valid note and has a valid note id
    questions.forEach(async (file) => {
        const isValid = checkIfDerivativeFileIsValid(file);
        if (!isValid) {
            await deleteFile(this.app.vault, file)
        }
    })
}