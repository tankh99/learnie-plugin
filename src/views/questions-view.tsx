import { App, ItemView, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { QUESTION_FOLDER_PATH } from '../utils/questions';
import { readFrontmatter } from '../utils/file';

export const QUESTIONS_VIEW = "questions-view"

export type ViewQuestionsState = {
    filePath?: string;
}
export class QuestionsView extends ItemView {

    private file: TFile;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf)
        // this.file = file;
    }

    getViewType(): string {
        return QUESTIONS_VIEW;
    }
    getDisplayText(): string {
        return "Questions"
    }

    async setState(state: ViewQuestionsState, result: ViewStateResult) {
        console.log("state", state)
        if (state.filePath) {

            const file = await this.app.vault.getFileByPath(state.filePath);
            if (file) {
                this.file = file;
            }
        }
        this.renderView();
        return super.setState(state, result);
    }


    async onOpen() {
        this.contentEl.setText("Questions View");
        // this.renderView();
        
    }

    async renderView() {

        let files: TFile[] = [];
        if (this.file) {
            files = [this.file];
        } else {
            files = this.app.vault.getFiles().filter(file => file.path.startsWith(QUESTION_FOLDER_PATH));
        }

        console.log("rendeiring view", this.file)
        type QuestionAndAnswer = {
            question: string;
            answer: string;
        }
        type NoteQnas = {
            qnas: QuestionAndAnswer[];
            noteId: string;
            filePath: string;
        }

        const noteQnas: NoteQnas[] = []
        for (const file of files) {
            const filecontent = await this.app.vault.cachedRead(file);
            const frontmatter = readFrontmatter(filecontent);
            const qns = frontmatter["questions"];
            const noteId = frontmatter["id"];
            noteQnas.push({ qnas: qns, noteId: noteId, filePath: file.path });
        }

        this.contentEl.createEl('h2', { text: 'Questions:' });
        this.contentEl.createEl('p', { text: 'Click on a question to reveal its answer'});
        const listEl = this.contentEl.createEl('ul');
        noteQnas.forEach(noteQna => {
            const questions = noteQna.qnas;
            const listItem = listEl.createEl('li');
            questions.forEach(qna => {
                const detailsEl = listItem.createEl('details');
                const summaryEl = detailsEl.createEl('summary', { text: `${qna.question}` });
                detailsEl.createEl('div', { text: `Answer: ${qna.answer}` });
            });

            listItem.createEl("br");
            // link.addEventListener('click', () => this.showQuestions(noteQna));
        });
    }

    async onClose() {

    }
}