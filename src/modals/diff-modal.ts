import { App, Component, Modal, TFile, WorkspaceLeaf } from "obsidian";
import { DIFF_VIEW_TYPE } from "src/views/diff-view";
export class DiffModal extends Modal {
    private styleId = 'diff-modal-style';
    private component: Component;
    private leaf: WorkspaceLeaf;
    private file: TFile;

    constructor(app: App, leaf: WorkspaceLeaf, file: TFile) {
        super(app);
        this.leaf = leaf;
        this.file = file;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.leaf.setViewState({
            type: DIFF_VIEW_TYPE,
            state: {
                file: this.file
            }
        })
        // this.app.workspace.getLeaf(true).setViewState({
        //     type: DIFF_VIEW_TYPE,
        //     state: {
        //         file: this.file
        //     }
        // })
    }

    private removeStyles() {
        const existingStyle = document.getElementById(this.styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.removeStyles();
    }
}