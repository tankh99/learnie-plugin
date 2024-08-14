import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { readFrontmatter } from "src/utils/file";
import { isValidNotePath, noteIsChanged, readNoteId } from "src/utils/note";
import { getLatestNoteRevision, getNoteRevisionByNoteId } from "src/utils/noteRevisions";
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

        // Sort by the earliest modified file
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
        const listEl = this.contentEl.createEl('ul', {
            attr: {
                style: "display:flex;flex-direction:column; row-gap:8px"
            }
        });

        let allReviewed = true;

        filesModifiedToday.forEach(file => {
          const listItem = listEl.createEl('li', { attr: { style: "display:flex; align-items:center;" } });
          const link = listItem.createEl('a', { text: file.path, href: '#' });
          const frontmatter = readFrontmatter(file);
          const noteId = frontmatter["id"];

          const noteRevision = getNoteRevisionByNoteId(noteId)
          const noteRevisionFrontmatter = readFrontmatter(noteRevision);
          const isReviewed = noteRevisionFrontmatter["reviewed"] ?? false

          const div = listItem.createEl("span", {attr: {
            style: `display:flex; align-items:center;`
          }})
          const checkbox = div.createEl("input", {type: "checkbox", attr: { style: "margin-left:6px;"}})
          checkbox.checked = isReviewed;
          checkbox.disabled = true;

          div.createEl("span", {text: "Reviewed", attr: {style: "margin-left:2px"}})
          link.addEventListener('click', () => this.showFileDiff(file));

          if (!isReviewed) {
            allReviewed = false;
          }
        });

        if (allReviewed) {
            this.contentEl.createEl('strong', { text: 'All notes have been reviewed today. Good work, see you tomorrow' });
        }
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

    this.app.workspace.getLeaf(false).setViewState({
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