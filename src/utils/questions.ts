import { createNewFile, getFile, modifyFrontmatter, readFrontmatter } from "./file";

export const QUESTION_FOLDER_PATH = "_Learnie_Questions"

export function formatQuestionFilename(noteId: string) {
    return `${noteId}-question`
}

export async function getQuestions(noteId: string) {
    const vault = this.app.vault;
    const filename = formatQuestionFilename(noteId)
    const questionFile = await getFile(vault, QUESTION_FOLDER_PATH, filename)
    if (!questionFile) {
        console.error(`Question file not found for note: ${noteId}`)
        return null;
    }

    const questionContent = await vault.read(questionFile)
    const frontmatter = readFrontmatter(questionContent)
    return frontmatter["questions"]

}

export async function createQuestion(noteId: string, question: string, answer: string) {
    const vault = this.app.vault;

    const filename = formatQuestionFilename(noteId)
    const createdFile = await createNewFile(vault, QUESTION_FOLDER_PATH, filename, "")
    if (!createdFile) {
        console.error(`Error creating file: ${noteId}-question`)
        return;
    }

    await modifyFrontmatter(createdFile, {
        questions: [
            {
                question, answer
            }
        ]
    })
}

export async function addQuestion(noteId: string, question: string, answer: string) {
    const vault = this.app.vault;
    const filename = formatQuestionFilename(noteId)
    const questionFile = await getFile(vault, QUESTION_FOLDER_PATH, filename)
    if (!questionFile) {
        await createQuestion(noteId, question, answer)
        return;
    }

    const questionContent = await vault.read(questionFile)
    const frontmatter = readFrontmatter(questionContent)
    const questions = frontmatter["questions"] ?? []
    questions.push({ question, answer })
    await modifyFrontmatter(questionFile, { questions })
}