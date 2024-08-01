import  { StrictMode, useEffect, useRef } from "react"
import { App, Component, ItemView, MarkdownRenderer, Notice, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { convertPathToObsidianLink } from "src/utils/obsidian-utils";
import { getLatestNoteRevision } from "src/utils/noteRevisions";
import * as diff from 'diff';
import { readNoteId } from "src/utils/note";
import { ensureNewline, formatDiffContent } from "src/utils/diff-utils";
import { modifyFrontmatter, readFileContent, readFrontmatter } from "src/utils/file";

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
    const revisionFilePath = convertPathToObsidianLink(app, revisionFile.path);
    useEffect(() => {
        if (markdownRef.current) {
            MarkdownRenderer.render(app, markdown, markdownRef.current, srcPath, component)

            // markdownRef.current.addEventListener("click", handleLinkClick)
        }

        return () => {
            markdownRef.current = null;
        }
    }, [markdown])

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
            <hr/>
            <h4>Revision controls</h4>
            <div style={{display: "flex", alignItems: "center", columnGap: "4px"}}>
                {/* <a href={srcPath}>Original File</a> */}
                <div style={{ display: "flex", alignItems: "center", }}>
                    <input id="learnie-reviewed"
                        onChange={handleReviewed}
                        type="checkbox" />
                    <p style={{ paddingLeft: "2px" }}>
                        Reviewed
                    </p>
                </div>
                <p> | </p>
                <a href={revisionFilePath}>Link to note revision</a>
            </div>
        </div>
    )
}

export const DIFF_VIEW_TYPE = "md-diff-view"

export type DiffMarkdownState = {
    file: TFile
}

export class DiffMarkdownView extends ItemView {

    root: Root | null = null
    app: App;
    file: TFile | undefined = undefined;

    constructor(leaf: WorkspaceLeaf, file?: TFile) {
        super(leaf)
        this.file = file;
    }

    getViewType(): string {
        return DIFF_VIEW_TYPE
    }

    getDisplayText(): string {
        return "Diff view"
    }
    
    async setState(state: DiffMarkdownState, result: ViewStateResult) {
        if (state.file) {
            this.file = state.file;
        }
        await this.renderView();
        return super.setState(state, result);
    }

    async onOpen() {
        if (!this.file) return;
        await this.renderView()
    }

    async renderView() {
        try {
            this.root = this.root ?? createRoot(this.containerEl.children[1])
            const file = this.file ?? this.app.workspace.getActiveFile();
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

            let {content} = await readFileContent(file)
            content = ensureNewline(content)
            let {content: oldContent} = await readFileContent(revisionFile)
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
        } catch (err) {
            console.error(err)
        }
    }

    async onClose() {
        this.root?.unmount()
    }
}