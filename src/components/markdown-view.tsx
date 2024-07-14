import React, { StrictMode, useEffect, useRef } from "react"
import { App, Component, ItemView, MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { convertPathToObsidianLink } from "src/utils/obsidian-utils";
import { getLatestNoteRevision } from "src/utils/noteRevisions";
import * as diff from 'diff';
import { readNoteId } from "src/utils/note";
import { ensureNewline, formatDiffContent } from "src/utils/diff-utils";
import { modifyFrontmatter, readFrontmatter } from "src/utils/file";

type P = {
    app: App,
    markdown: string;
    srcPath: string;
    component: Component,
    revisionFile: TFile;
    revisionFrontmatter: Record<string, any>;
}

export const ReactMarkdownView = ({ app, markdown, srcPath, component, revisionFile, revisionFrontmatter }: P) => {
    const markdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (markdownRef.current) {
            MarkdownRenderer.render(app, markdown, markdownRef.current, srcPath, component)

            // markdownRef.current.addEventListener("click", handleLinkClick)
        }

        return () => {
            markdownRef.current = null;
        }
    }, [markdown])

    // Overrides default link behavior with Obsidian's linking logic instead
    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const target = event.target;
        // if (target.tagName === "A" && target.dataset.href) {
        //     event.preventDefault();
        //     const href = target.getAttribute("href");
        //     app.workspace.openLinkText(href, srcPath);
        // }
    }

    const handleReviewed = (event: any) => {
        const target = event.target;
        const newFrontmatter = {
            ...revisionFrontmatter,
            reviewed: target.checked
        }
        modifyFrontmatter(revisionFile, newFrontmatter)
    }

    return (
        <div style={{ userSelect: "text" }}>
            <div ref={markdownRef}></div>
            {/* <Markdown>{markdown}</Markdown> */}
            <div>
                <a href={srcPath}>Original File</a>
                <div style={{ display: "flex", alignItems: "center", }}>
                    <input id="learnie-reviewed"
                        onChange={handleReviewed}
                        type="checkbox" />
                    <p style={{ paddingLeft: "2px" }}>
                        Reviewed
                    </p>
                </div>
            </div>
        </div>
    )
}

export const EXAMPLE_VIEW_TYPE = "react-view"
export class ExampleView extends ItemView {

    root: Root | null = null
    app: App;

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf)
        this.app = app;
    }

    getViewType(): string {
        return EXAMPLE_VIEW_TYPE
    }
    getDisplayText(): string {
        return "Example View"
    }


    async onOpen() {
        this.root = createRoot(this.containerEl.children[1])
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice("No file selected");
            return;
        }

        const noteId = await readNoteId(this.app.vault, file);
        if (!noteId) {
            new Notice("No note ID found in note");
            return;
        }
        const revisionFile = await getLatestNoteRevision(this.app.vault, noteId);
        if (!revisionFile) {
            new Notice("No revision found. Is this a note?");
            return;
        }

        let content = await this.app.vault.read(file);
        content = ensureNewline(content)
        let oldContent = await this.app.vault.read(revisionFile);
        oldContent = ensureNewline(oldContent)

        let diffContent = diff.createPatch(file.path, oldContent, content);
        // diffContent = content
        diffContent = formatDiffContent(this.app, diffContent);
        // console.log(content);
        const srcPath = convertPathToObsidianLink(this.app, file.path);

        const noteRevisionFrontmatter = readFrontmatter(oldContent)
        this.root.render(
            <StrictMode>
                <ReactMarkdownView
                    app={this.app}
                    srcPath={srcPath} 
                    component={this} 
                    markdown={diffContent}
                    revisionFile={revisionFile}
                    revisionFrontmatter={noteRevisionFrontmatter} />
            </StrictMode>
        );

    }
    async onClose() {
        this.root?.unmount()
    }
}