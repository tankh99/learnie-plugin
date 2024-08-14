import { ItemView, Notice, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { getFile, QUESTION_FOLDER_PATH } from "src/utils/file";
import { readFrontmatter } from '../utils/file';
import { QuestionAnswerPair } from 'src/types/types';
import { renderMarkdown } from 'src/utils/md-utils';
import { getNoteByNoteId } from 'src/utils/note';
import { convertPathToObsidianLink } from 'src/utils/obsidian-utils';

export const QUESTIONS_VIEW = "questions-view"

export type ViewQuestionsState = {
    filePath?: string;
}

/**
 * This shows the view for ALL questions, or just the active file's questions
 */
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

    override getState(): ViewQuestionsState {
        return {
            filePath: this.file?.path
        }
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
        for (const noteQna of noteQnas) {
            const originalNote = await getNoteByNoteId(noteQna.noteId);
            
            const qnas = noteQna.qnas;
            if (qnas.length == 0) continue;
            if (!originalNote)  {
                new Notice(`Unable to find note with id: ${noteQna.noteId}`);
                continue;
            }
            const headerLinkEl = this.contentEl.createEl("a", { 
                attr: { 
                    href: `${convertPathToObsidianLink(this.app, originalNote.path)}`,
                } });
            headerLinkEl.createEl("h4", {text: originalNote?.basename});
            const listEl = this.contentEl.createEl("ol", {attr: {
                style: "display:flex; flex-direction:column; gap: 0.5rem"
            }})
            
            for (const qna of qnas) {
                const listItem = listEl.createEl('li');
                const detailsEl = listItem.createEl('details');

                detailsEl.createEl('summary', { text: `${qna.question}` });

                const ans = await renderMarkdown(qna.answer, noteQna.filePath, this);
                const answerelem = detailsEl.createEl('div');
                answerelem.innerHTML = ans
            }
            listEl.createEl("br");
        }
    }

    async onClose() {

    }
}