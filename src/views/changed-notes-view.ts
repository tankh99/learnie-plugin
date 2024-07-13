import { differenceInDays, startOfDay } from "date-fns";
import { App, ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { BASE_FOLDER_PATH } from "src/utils/file";
import { DiffModal } from "../modals/diff-modal";
import * as diff from 'diff';
import { readNoteId } from "src/utils/note";
import { getLatestNoteRevision } from "src/utils/noteRevisions";

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
        const today = startOfDay(new Date());
        const filesModifiedToday: TFile[] = [];

        const files = this.appInstance.vault.getFiles().filter(file => !file.path.startsWith(BASE_FOLDER_PATH));
        
        for (const file of files) {
            const fileStats = await this.appInstance.vault.adapter.stat(file.path);
            const lastModified = fileStats!.mtime;

            if (differenceInDays(lastModified, today) >= 0){
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
    const currentContent = await this.appInstance.vault.read(file);
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

    const historyContent = await this.appInstance.vault.read(latestNoteRevision);

    const diffResult = diff.createPatch(file.path, historyContent, currentContent);
    const diffModal = new DiffModal(this.appInstance, diffResult, file.path, this);
    diffModal.open();
  }


    async onClose() {

    }
}