import { App, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { QUESTION_FOLDER_PATH } from '../utils/questions';
import { readFrontmatter } from '../utils/file';

export const QUESTIONS_VIEW = "questions-view"

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

    async onOpen() {
        this.contentEl.setText("Questions View");
        const files: TFile[] = this.app.vault.getFiles().filter(file => file.path.startsWith(QUESTION_FOLDER_PATH));

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

            // const link = listItem.createEl('a', { text: noteQna.filePath, href: '#' });
            listItem.createEl("br");
            // link.addEventListener('click', () => this.showQuestions(noteQna));
        });
    }

    async onClose() {

    }
}