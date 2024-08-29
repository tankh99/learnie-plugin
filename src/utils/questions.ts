import { Notice, TFile, Vault, moment } from "obsidian";
import { checkIfDerivativeFileIsValid, createNewFile, deleteFile, getFile, modifyFrontmatter, QUESTION_FOLDER_PATH, readFrontmatter } from "./file";
import { isValidNotePath } from "./note";
import { QuestionAnswerPair, QuizQuestion } from "src/types/types";
import { v4 as uuidv4 } from 'uuid';


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

export async function getAllQuestions() {
    const allQuestionFiles = getAllQuestionFiles()
    const questions = []
    for (const questionFile of allQuestionFiles) {
        const frontmatter = await readFrontmatter(questionFile);
        const noteId = frontmatter["id"]
        const qnas: QuestionAnswerPair[] = frontmatter['questions'] ?? []
        if (!noteId) {
            new Notice(`Error: Unable to find note id in ${questionFile.path}`)
            continue;
        }
        const qnasWithFilePath: QuizQuestion[] = qnas.map((qna) => {
            return {
                ...qna,
                noteId,
                questionFile,
            }
        })
        questions.push(...qnasWithFilePath)
    }
    return questions;
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
            id: uuidv4(),
            question,
            answer,
            lastSeen: moment().toDate(),
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
        id: uuidv4(),
        question,
        answer,
        lastSeen: moment().toDate(),
        categories: []
    }
    questions.push(qna)
    await modifyFrontmatter(questionFile, { questions })
    new Notice("Successfully added a question");
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

/**
 * Updates the lastSeen property for a specific question in a note.
 * 
 * @param noteId - The ID of the note containing the question.
 * @param questionText - The text of the question to update.
 * @param lastSeen - The new lastSeen timestamp.
 */
export async function updateQuestionLastSeen(noteId: string, questionId: string, lastSeen: Date) {
    const questionFile = await getQuestionFile(noteId);
    if (!questionFile) {
        new Notice(`Error: Unable to find note with id ${noteId}`);
        return;
    }

    const frontmatter = await readFrontmatter(questionFile);

    if (frontmatter && frontmatter.questions) {
        for (const qna of frontmatter.questions) {
            if (qna.id === questionId) {
                qna.lastSeen = lastSeen;
                break;
            }
        }


        await modifyFrontmatter(questionFile, frontmatter); // Save the updated frontmatter back to the file
    }
}

/**
 * Create an array of question-weight pairs, 
 * then sort them by weight, 
 * and choose the first n number of question
 * then shuffle them
 * @param questions 
 * @param numQuestions 
 * @returns 
 */
export function selectRandomWeightedQuestions(questions: QuizQuestion[], numQuestions: number) {
    const selectedQuestions = []
    

    const weightedQuestions = questions.map((qna, index: number) => {
        const ageInDays = moment().diff(qna.lastSeen, 'days');
        return {
            index,
            question: qna,
            age: Math.max(ageInDays, 0)
        }
    })

    const sortedWeightedQuestions = weightedQuestions.sort((a,b) => a.age - b.age)
    for (let i = 0; i < numQuestions; i++) {
        const selected = sortedWeightedQuestions.shift();
        if (selected) {
            selectedQuestions.push(selected.question)
        }
    }

    return selectedQuestions.shuffle();
}

/**
 * Migrates old questions to add 2 new properties: lastSeen and id
 */
export async function migrateQuestions() {
    const questionFiles = await getAllQuestionFiles();
    for (const questionFile of questionFiles) {
        const frontmatter = await readFrontmatter(questionFile);
        const noteId = frontmatter["id"];
        if (!noteId) {
            new Notice(`Error: Unable to find note id in ${questionFile.path}`)
            continue;
        }

        const qnas: QuestionAnswerPair[] = frontmatter['questions'] ?? []
        for (const qna of qnas) {
            if (!qna.id) {
                qna.id = uuidv4();
            }
            if (!qna.lastSeen) {
                qna.lastSeen = moment().toDate();
            }
        }
        await modifyFrontmatter(questionFile, { questions: qnas })
    }

}