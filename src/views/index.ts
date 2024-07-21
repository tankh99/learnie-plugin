import { CHANGED_NOTES_VIEW_TYPE } from "./changed-notes-view";
import { QUESTIONS_VIEW } from "./qns-view";

export async function activateChangedNotesView(newLeaf = false) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({ type: CHANGED_NOTES_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
}

export async function activateQnsView(newLeaf = false) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({ type: QUESTIONS_VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
}