import  { StrictMode, useEffect, useRef } from "react"
import { App, Component, ItemView, MarkdownRenderer, Notice, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { convertPathToObsidianLink } from "src/utils/obsidian-utils";
import { getLatestNoteRevision } from "src/utils/noteRevisions";
import * as diff from 'diff';
import { readNoteId } from "src/utils/note";
import { ensureNewline, formatDiffContent } from "src/utils/diff-utils";
import { modifyFrontmatter, readFileContent, readFrontmatter } from "src/utils/file";
import { marked } from "marked";
import {sanitize} from "dompurify";

type P = {
    app: App,
    title: string;
    markdown: string;
    srcPath: string;
    component: Component,
    revisionFile: TFile;
    revisionFrontmatter: Record<string, any>;
}

export const ReactMarkdownView = ({ app, title, markdown, srcPath, revisionFile, revisionFrontmatter }: P) => {
    const revisionFilePath = convertPathToObsidianLink(app, revisionFile.path);

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
            <h2>{title}</h2>
            <div dangerouslySetInnerHTML={{__html: markdown}}></div>
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
                <p> | </p>
                <a href={srcPath}>Link to source file</a>
            </div>
        </div>
    )
}

export const DIFF_VIEW_TYPE = "md-diff-view"

export type DiffMarkdownState = {
    file: TFile
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

            const tokenizer = {
                codespan(src: any) {
                    const latexMatch = src.match(/^\$+([^$\n]+?)\$+/);
                    if (latexMatch) {
                        const result: any = {
                            type: 'codespan',
                            raw: latexMatch[0],
                            text: latexMatch[1].trim()
                        };
                        return result;
                    }

                    // return false to use original codespan tokenizer
                    return false;
                },
            };
            marked.use({tokenizer})
            content = sanitize((content))
            oldContent = sanitize((oldContent))

            const changes = diff.diffLines(oldContent, content);
            const diffContent = await formatDiffContent(changes);
            const srcPath = convertPathToObsidianLink(this.app, file.path);

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