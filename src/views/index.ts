import { TFile } from "obsidian";
import { CHANGED_NOTES_VIEW_TYPE } from "./changed-notes-view";
import { DIFF_VIEW_TYPE } from "./markdown-view";
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

export async function activateDiffView(newLeaf = false, file?: TFile) {
    const leaf = this.app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({
        type: DIFF_VIEW_TYPE, state: {
            file: file
        }, active: true
    });
    this.app.workspace.revealLeaf(leaf);
}