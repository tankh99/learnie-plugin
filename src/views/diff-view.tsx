import { StrictMode, useEffect, useRef } from "react";
import { App, Component, ItemView, MarkdownRenderer, Notice, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { convertPathToObsidianLink } from "src/utils/obsidian-utils";
import { checkIfNoteRevisionIsReviewed, getLatestNoteRevision } from "src/utils/noteRevisions";
import * as diff from 'diff';
import { readNoteId } from "src/utils/note";
import { formatDiffContent } from "src/utils/diff-utils";
import { modifyFrontmatter, readFileContent, readFrontmatter } from "src/utils/file";
import { sanitize } from "dompurify";

type P = {
    app: App,
    title: string;
    markdown: string;
    srcPath: string;
    component: Component,
    revisionFile: TFile;
    revisionFrontmatter: Record<string, any>;
}

export const ReactMarkdownView = ({ app, title, markdown, srcPath, revisionFile, revisionFrontmatter, component }: P) => {
    const handleReviewed = (event: any) => {
        const target = event.target;
        const newFrontmatter = {
            ...revisionFrontmatter,
            // reviewed: target.checked
            lastReviewed: target.checked ? new Date() : undefined,
        }
        modifyFrontmatter(revisionFile, newFrontmatter)
    }

    const navigateToFile = (path: string, newLeaf = true) => {
        let leaf;

        // If newLeaf is false, we open the file in the most recent leaf
        // note: There is a circular dependency erorr if we navigate from view -> view -> file -> file (via internal link)
        // do we always use newLeaf = true for now
        if (!newLeaf) {
            leaf = app.workspace.getMostRecentLeaf()
        } else {
            leaf = app.workspace.getLeaf(true);
        }
        const file = app.vault.getFileByPath(path);
        if (!file) {
            new Notice(`Unable to open file with path ${path}`)
            return;
        }
        leaf?.openFile(file)
    }

    return (
        <div style={{ userSelect: "text" }}>
            <h2>{title}</h2>
            <div style={{display: "flex", alignItems: "center", columnGap: "4px"}}>
                {/* <a href={srcPath}>Original File</a> */}
                <div style={{ display: "flex", alignItems: "center", }}>
                    <input id="learnie-reviewed"
                        onChange={handleReviewed}
                        defaultChecked={checkIfNoteRevisionIsReviewed(revisionFile)}
                        type="checkbox" />
                    <p style={{ paddingLeft: "2px" }}>
                        Reviewed
                    </p>
                </div>
                <p> | </p>
                <a onClick={() => navigateToFile(srcPath)}>Link to source file</a>
                <p> | </p>
                <a onClick={() => navigateToFile(revisionFile.path)}>Link to note revision</a>
            </div>
            <hr/>
            {/* Note: We use setHTML instead of renderMarkdown because latex disappears after being put through renderMarkdown more than once */}
            <div dangerouslySetInnerHTML={{__html: markdown}}></div>
        </div>
    )
}

export const DIFF_VIEW_TYPE = "md-diff-view"

export type DiffMarkdownState = {
    file: TFile | undefined;
}

export class DiffView extends ItemView {

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
    
    // This enables this.file to remain in memory even after navigating aray
    override getState(): DiffMarkdownState {
        return {
            file: this.file,
        };
    }

    async setState(state: DiffMarkdownState, result: ViewStateResult) {
        if (state.file) {
            this.file = state.file;
        }
        await this.renderView();
        return super.setState(state, result);
    }

    async onOpen() {
        if (!this.file) {
            return;
        }
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
            let {content: oldContent} = await readFileContent(revisionFile)

            content = sanitize((content))
            oldContent = sanitize((oldContent))

            const changes = diff.diffLines(oldContent, content);
            const diffContent = await formatDiffContent(changes, file.path, this);

            const noteRevisionFrontmatter = readFrontmatter(revisionFile)
            if (!noteRevisionFrontmatter) {
                new Notice("No frontmatter found in note revision")
                return;
            }

            this.root.render(
                <StrictMode>
                    <ReactMarkdownView
                        title={file.basename}
                        app={this.app}
                        srcPath={file.path}
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
        this.root = null;
    }
}