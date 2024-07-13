import { App, Component, MarkdownRenderChild, MarkdownRenderer, TFile } from "obsidian";
import { extractContentFromNote } from "src/utils/note";

export class DiffMarkdownView extends MarkdownRenderChild {
    private markdownContent: string;
    private app: App;
    private srcPath: string;
    private component: Component;
    constructor(containerEl: HTMLElement, markdownContent: string, app: App, srcPath: string, component: Component) {
        super(containerEl)
        this.markdownContent = markdownContent;
        this.app = app;
        this.srcPath = srcPath;
        this.component = component
    }

    async onload() {
        const markdownContainer = this.containerEl.createDiv();
        markdownContainer.style.userSelect = 'text';
        // console.log("mard content", this.markdownContent);
        const content = extractContentFromNote(this.markdownContent);
        // console.log("content", content)
        // const formattedContent = formatDiffContent(content)
        await MarkdownRenderer.render(this.app, content, markdownContainer, this.srcPath, this.component);
    }
}
