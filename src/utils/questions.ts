import { Notice, TFile, Vault, moment } from "obsidian";
import { checkIfDerivativeFileIsValid, createNewFile, deleteFile, getFile, modifyFrontmatter, QUESTION_FOLDER_PATH, readFrontmatter } from "./file";
import { isValidNotePath } from "./note";
import { QuestionAnswerPair } from "src/types/types";


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

/**
 * Gets questions from a specific note with a specified noteId
 * @param noteId 
 * @returns 
 */
export async function getQuestions(noteId: string) {
    const questionFile = await getQuestionFile(noteId)
    if (!questionFile) {
        console.error(`Question file not found for note: ${noteId}`)
        return null;
    }

    const frontmatter = readFrontmatter(questionFile)
    return frontmatter["questions"] ?? []

}

// Overrides any pre-existing questions array in thr frontmatter
export async function createQuestion(noteId: string, question: string, answer: string, categories: string[]) {
    const vault = this.app.vault;

    const filename = formatQuestionFilename(noteId)
    const createdFile = await createNewFile(vault, QUESTION_FOLDER_PATH, filename, "")
    if (!createdFile) {
        console.error(`Error creating file: ${noteId}-question`)
        return;
    }

    const questions = []
    if (question && answer) {
        const qna: QuestionAnswerPair = {
            question,
            answer,
            lastSeen: new Date(),
            categories,
        }

        questions.push(qna)
    }

    await modifyFrontmatter(createdFile, {
        id: noteId,
        questions: questions,
        // noteLink: `[[${notePath}]]`
    })
    return createdFile;
}

export async function addQuestion(noteId: string, file:TFile, question: string, answer: string, categories: string[]) {
    const filename = formatQuestionFilename(noteId)
    const questionFile = await getFile(QUESTION_FOLDER_PATH, filename)

    if (!isValidNotePath(file.path)) {
        new Notice("You cannot add questions to this file")
        return
    }
    if (!questionFile) {
        await createQuestion(noteId, question, answer, categories)
        // await modifyFrontmatter(file, {"questionLink": formatRelativeLink(`${QUESTION_FOLDER_PATH}/${filename}.md`, "View Questions")})
        return;
    }

    const frontmatter = readFrontmatter(questionFile)
    const questions = frontmatter["questions"] ?? [];
    const qna: QuestionAnswerPair = {
        question,
        answer,
        lastSeen: moment().toDate(),
        categories: []
    }
    questions.push(qna)
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