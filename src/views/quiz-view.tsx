import { ItemView, Notice, WorkspaceLeaf, moment } from 'obsidian';
import {getAllQuestionFiles, getAllQuestions, selectRandomWeightedQuestions, updateQuestionLastSeen} from '../utils/questions'
import { readFrontmatter } from '../utils/file';
import { renderMarkdown } from 'src/utils/md-utils';
import { QuestionAnswerPair } from 'src/types/types';
import { convertPathToObsidianLink } from 'src/utils/obsidian-utils';
import { getNoteByNoteId } from 'src/utils/note';

export const QUIZ_VIEW_TYPE = "quiz-view"

/**
 * Gets the a list of 10 questions from random notes
 */
export class QuizView extends ItemView {

    // Default questions to render
    numQuestions = 10;
    constructor(leaf: WorkspaceLeaf, numQuestions?: number) {
        super(leaf)
        if (numQuestions) {
            this.numQuestions = numQuestions;
        }
    }

    getViewType(): string {
        return QUIZ_VIEW_TYPE
    }
    getDisplayText(): string {
        return "Quiz"
    }

    async onOpen() {
        this.contentEl.createEl("h2", {text: "Quiz view"})
        const questions = await getAllQuestions();
        const selectedQuestions = selectRandomWeightedQuestions(questions, this.numQuestions);

        const now = moment().toDate();

        for (const qna of selectedQuestions) {
            if (!qna.lastSeen) {
                new Notice("Error: Please run 'Migrate Questions' to enable the latest features")
                return;
            }
            qna.lastSeen = now; // Update in memory
            // Update in the data source (file, database, etc.)
            if (!qna.id) continue;
            await updateQuestionLastSeen(qna.noteId, qna.id, now); // You need to implement this utility function
        }

        const listEl = this.contentEl.createEl("ol", {attr: {
            style: "display:flex; flex-direction:column; gap: 0.5rem"
        }})
        for (const qna of selectedQuestions) {
            const listItem = listEl.createEl("li")
            const detailsEl = listItem.createEl("details")

            const srcNote = await getNoteByNoteId(qna.noteId);
            if (!srcNote) {
                new Notice(`Error: Unable to find note with id ${qna.noteId}`)
                continue;
            }
            const questionLink = convertPathToObsidianLink(this.app, srcNote.path)
            const questionEl = detailsEl.createEl("summary", {text: `${qna.question}`})
            const questionLinkEl = questionEl.createEl("a", {attr: {href: questionLink, style: "margin-left: 0.5rem"}})
            questionLinkEl.textContent = `${srcNote.basename}`
            
            const ans = await renderMarkdown(qna.answer, qna.questionFile.path, this);
            const answerelem = detailsEl.createEl('div');
            answerelem.innerHTML = ans
        }

    }

}