import React, { StrictMode, useEffect, useRef } from "react"
import {App, Component, ItemView, MarkdownRenderer, Notice, WorkspaceLeaf} from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { convertPathToObsidianLink } from "utils/md-utils";

type P = {
    app: App,
    markdown: string;
    srcPath: string;
    component: Component,
}

export const ReactView = ({app, markdown, srcPath, component}: P) => {
    const markdownRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
        if (markdownRef.current) {
            MarkdownRenderer.render(app, markdown, markdownRef.current, srcPath, component)

            markdownRef.current.addEventListener("click", handleLinkClick)
        }

        return () => {
            markdownRef.current = null;
        }
    }, [markdown])

    const handleLinkClick = (event: any) => {
        const target = event.target;
        if (target.tagName === "A" && target.dataset.href) {
            event.preventDefault();
            const href = target.getAttribute("href");
            app.workspace.openLinkText(href, srcPath);
        }
    }

	return (
        <div>
            <div ref={markdownRef}></div>
            <a href={srcPath}>Original File</a>
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

        const content = await this.app.vault.read(file);
        // console.log(content);
        const srcPath = convertPathToObsidianLink(file.path);
        this.root.render(
            <StrictMode>
                <ReactView app={this.app} srcPath={srcPath} component={this} markdown={content} />
            </StrictMode>
        );

    }
    async onClose() {
        this.root?.unmount()
    }
}