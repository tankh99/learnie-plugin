import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { addCommands } from 'src/commands';
import { handleNoteChange } from "src/utils/note";
import { registerViews } from 'src/views';
import "./styles.css";

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



// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));

// 		new Setting(containerEl)
// 				.setName("Test")
// 				.setDesc("Test only")
// 	}
// }
