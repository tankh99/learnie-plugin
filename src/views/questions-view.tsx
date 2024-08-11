import { ItemView, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { QUESTION_FOLDER_PATH } from "src/utils/file";
import { readFrontmatter } from '../utils/file';
import { marked } from 'marked';
import { QuestionAnswerPair } from 'src/types/types';

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
        this.contentEl.setText("Questions view");
        
    }

    async renderView() {

        let files: TFile[] = [];
        if (this.file) {
            files = [this.file];
        } else {
            files = this.app.vault.getFiles().filter(file => file.path.startsWith(QUESTION_FOLDER_PATH));
        }

        type NoteQnas = {
            qnas: QuestionAnswerPair[];
            noteId: string;
            filePath: string;
        }

        const noteQnas: NoteQnas[] = []
        for (const file of files) {

            const frontmatter = readFrontmatter(file);
            if (!frontmatter) continue;
            const questions = frontmatter["questions"] ?? [];
            const noteId = frontmatter["id"];
            noteQnas.push({ qnas: questions, noteId: noteId, filePath: file.path });
        }

        this.contentEl.createEl('h2', { text: 'Questions:' });
        this.contentEl.createEl('p', { text: 'Click on a question to reveal its answer'});
        const listEl = this.contentEl.createEl('ol');
        for (const noteQna of noteQnas) {
            const qnas = noteQna.qnas;
            const listItem = listEl.createEl('li');
            for (const qna of qnas) {
                const detailsEl = listItem.createEl('details');

                detailsEl.createEl('summary', { text: `${qna.question}` });

                const ans = await marked(qna.answer)
                const answerelem = detailsEl.createEl('div');
                answerelem.innerHTML = ans
            }
            listItem.createEl("br");
        }
    }

    async onClose() {

    }
}