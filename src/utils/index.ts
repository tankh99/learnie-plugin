import { App, Notice, TFile } from "obsidian";
import { QUESTIONS_VIEW } from "src/views/qns-view";

export async function handleActivateView(app: App) {
    app.workspace.on('', (url: URL) => {
        if (url.pathname === '/activate-view') {
            const params = new URLSearchParams(url.search);
            const viewType = params.get('view');
            const filePath = params.get('file');

            if (viewType === QUESTIONS_VIEW && filePath) {
                const file = app.vault.getAbstractFileByPath(decodeURIComponent(filePath));
                if (file instanceof TFile) {
                    app.workspace.getLeaf(true).setViewState({
                        type: QUESTIONS_VIEW,
                        state: { file },
                        active: true,
                    });
                    new Notice('Activated Note Revision View');
                }
            }
        }
    });
}