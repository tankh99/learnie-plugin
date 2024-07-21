import { CHANGED_NOTES_VIEW_TYPE } from "./changed-notes-view";
import { QUESTIONS_VIEW } from "./qns-view";

export async function activateChangedNotesView() {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: CHANGED_NOTES_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
}

export async function activateQnsView() {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: QUESTIONS_VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
}