import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { isValidNotePath, noteIsChanged, readNoteId } from "src/utils/note";
import { getLatestNoteRevision } from "src/utils/noteRevisions";
import { DIFF_VIEW_TYPE } from "src/views/diff-view";

export const CHANGED_NOTES_VIEW_TYPE = "changed-notes-view"

export class ChangedNotesView extends ItemView {

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return (CHANGED_NOTES_VIEW_TYPE)
    }

    getDisplayText(): string {
        return "Changed notes";
    }


    async onOpen() {
        this.contentEl.empty();
        const filesModifiedToday: TFile[] = [];

        const files = this.app.vault.getFiles().filter(file => isValidNotePath(file.path));

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

        filesModifiedToday.sort((a, b) => {
            const aFile = this.app.vault.getFileByPath(a.path);
            const bFile = this.app.vault.getFileByPath(b.path);
            if (!aFile || !bFile) return 0;
            const aModified = aFile.stat.mtime ?? 0;
            const bModified = bFile.stat.mtime ?? 0;
            return aModified - bModified
        })

        this.contentEl.createEl('h2', { text: 'Notes modified today:' });
        this.contentEl.createEl("i", { text: "Notes sorted by most first modified"})
        const listEl = this.contentEl.createEl('ul');
        filesModifiedToday.forEach(file => {
          const listItem = listEl.createEl('li');
          const link = listItem.createEl('a', { text: file.path, href: '#' });
          link.addEventListener('click', () => this.showFileDiff(file));
        });
    }


  private async showFileDiff(file: TFile) {
    const noteId = await readNoteId(this.app.vault, file)
    if (!noteId) {
        new Notice(`No note ID found in note ${noteId}`);
        return
    }

    const latestNoteRevision = await getLatestNoteRevision(this.app.vault, noteId);

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