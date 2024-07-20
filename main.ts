import { DIFF_VIEW_TYPE, DiffMarkdownView } from './src/components/markdown-view';
import { App, Editor, ItemView, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, View, WorkspaceLeaf } from 'obsidian';
import { convertToNote, handleNoteChange } from "src/utils/note";
import { ChangedNotesView, VIEW_TYPE } from 'src/views/changed-notes-view';
import "./styles.css";
import { readFrontmatter } from 'src/utils/file';
import { QuestionAnswerModal } from 'src/modals/qna-modal';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: "review",
			name: "Review Notes",
			callback: () => {
				this.activateView();
			}
		})

		this.addCommand({
			id: "convert-to-note",
			name: "Convert to note",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const file = view.file;
				if (!file) return new Notice("No file selected")
				// TODO: Check that the file is NOT already
				// 1. a note
				// 2. a file in the history folder
				convertToNote(this.app.vault, file)
			}
		
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerEvent(this.app.vault.on("modify", () => {
			handleNoteChange(this.app.vault, this.app.workspace.getActiveFile())
		}))

		this.registerView(
			VIEW_TYPE,
			(leaf) => new ChangedNotesView(leaf, this.app)
		);

		this.registerView(
			DIFF_VIEW_TYPE,
			(leaf) => new DiffMarkdownView(leaf, this.app)
		)

		this.addCommand({
			id: "show-markdown",
			name: "Show Markdown",
			callback: async () => {
				// this.showMarkdownView();
				const leaf = this.app.workspace.getLeaf(true);
				await leaf.setViewState({ type: DIFF_VIEW_TYPE, active: true });
				this.app.workspace.setActiveLeaf(leaf);
			}
		})

		this.addCommand({
			id: "create-question",
			name: "Create Question",
			callback: async () => {
				// selected text
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				if (!editor) return;
				const file = await this.app.workspace.getActiveFile();
				if (!file) return;

				const filecontent = await this.app.vault.read(file);
				const frnotmatter = readFrontmatter(filecontent);
				const noteId = frnotmatter["id"];

				const selectedText = editor.getSelection();

				new QuestionAnswerModal(this.app, noteId, selectedText).open()
			}
		})

		this.addCommand({
			id: "test",
			name: "test",
			callback: async () => {
				// new QuestionAnswerModal(this.app,).open()
				// const file = this.app.workspace.getActiveFile();
				// if (!file) return
				// const content = await this.app.vault.read(file)
				// const frontmatter = readFrontmatter(content);
				// const noteId = frontmatter["id"]
				// console.log(frontmatter, noteId)
				// await addQuestion(noteId, "What is the capital of France?", "Paris")

				// const questionse = await getQuestions(noteId)
				// console.log("questions", questionse)
			}
		})

		this.loadStyles()
	}

	loadStyles() {
		const style = document.createElement("style")

		style.id = "learnie-tailwind"
		// console.log(tailwindCss)
		// style.textContent = tailwindCss
		document.head.appendChild(style);
	}

	// async showMarkdownView() {
	// 	const containerEl = this.addRootElement();
	// 	const file = this.app.workspace.getActiveFile();
	// 	if (!file) return;

	// 	const content = await this.app.vault.read(file);
	// 	const mdView = new DiffMarkdownView(containerEl, content, this.app, file.path, this);
	// 	this.registerView("md-view", mdView);
	// }


	addRootElement() {
		const rootEl = document.body.createDiv();
		rootEl.style.position = 'fixed';
		rootEl.style.top = '50%';
		rootEl.style.left = '50%';
		rootEl.style.transform = 'translate(-50%, -50%)';
		rootEl.style.backgroundColor = 'white';
		rootEl.style.padding = '1rem';
		rootEl.style.zIndex = '1000';
		return rootEl;
	}

	onunload() {
		document.getElementById("learnie-tailwind")?.remove()
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}
}



class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
				.setName("Test")
				.setDesc("Test only")
	}
}
