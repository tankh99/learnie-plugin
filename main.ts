import { QUESTIONS_VIEW, QuestionsView } from './src/views/questions-view';
import { DIFF_VIEW_TYPE, DiffMarkdownView } from './src/views/markdown-view';
import { App, Editor, ItemView, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, View, WorkspaceLeaf } from 'obsidian';
import { convertToNote, handleNoteChange } from "src/utils/note";
import { ChangedNotesView, CHANGED_NOTES_VIEW_TYPE } from 'src/views/changed-notes-view';
import "./styles.css";
import { readFrontmatter } from 'src/utils/file';
import { QuestionAnswerModal } from 'src/modals/qna-modal';
import { addCommands } from 'src/commands';
import { registerViews } from 'src/views';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		// await this.loadSettings();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerEvent(this.app.vault.on("modify", () => {
			handleNoteChange(this.app.vault, this.app.workspace.getActiveFile())
		}))

		registerViews(this);

		addCommands(this)

		this.loadStyles()
	}

	loadStyles() {
		const style = document.createElement("style")

		style.id = "learnie-tailwind"
		// style.textContent = tailwindCss
		document.head.appendChild(style);
	}

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
