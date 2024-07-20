import { differenceInDays, startOfDay } from "date-fns";
import { App, ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { DiffModal } from "../modals/diff-modal";
import * as diff from 'diff';
import { NOTE_FOLDER_PATH, noteIsChanged, readNoteId } from "src/utils/note";
import { getLatestNoteRevision } from "src/utils/noteRevisions";
import { DIFF_VIEW_TYPE } from "src/views/markdown-view";

export const VIEW_TYPE = "changed-notes-view"

export class ChangedNotesView extends ItemView {
    private appInstance: App;

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf);
        this.appInstance = app;
    }

    getViewType(): string {
        return (VIEW_TYPE)
    }

    getDisplayText(): string {
        return "Changed Notes";
    }


    async onOpen() {
        this.contentEl.empty();
        const filesModifiedToday: TFile[] = [];

        const files = this.appInstance.vault.getFiles().filter(file => !file.path.startsWith(NOTE_FOLDER_PATH));

        for (const file of files) {
            const noteId = await readNoteId(this.app.vault, file);
            if (!noteId) continue;
            const noteChanged = await noteIsChanged(file);
            if (noteChanged) {
                filesModifiedToday.push(file);
            }
        }

        if (filesModifiedToday.length === 0) {
            this.contentEl.createEl('div', { text: 'No notes modified today.' });
            return;
        }

        this.contentEl.createEl('h2', { text: 'Notes modified today:' });
        const listEl = this.contentEl.createEl('ul');
        filesModifiedToday.forEach(file => {
          const listItem = listEl.createEl('li');
          const link = listItem.createEl('a', { text: file.path, href: '#' });
          link.addEventListener('click', () => this.showFileDiff(file));
        });
    }


  private async showFileDiff(file: TFile) {
    const noteId = await readNoteId(this.appInstance.vault, file)
    if (!noteId) {
        new Notice(`No note ID found in note ${noteId}`);
        return
    }

    const latestNoteRevision = await getLatestNoteRevision(this.appInstance.vault, noteId);

    if (!latestNoteRevision) {
        new Notice(`No note revision found for today.`);
      return;
    }

    this.app.workspace.getLeaf(true).setViewState({
        type: DIFF_VIEW_TYPE,
        state: {
            file: file
        },
        active: true
    })
  }


    async onClose() {

    }
}