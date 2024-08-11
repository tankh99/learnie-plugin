import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { addCommands } from 'src/commands';
import { handleNoteChange } from "src/utils/note";
import { registerViews } from 'src/views';
import "./styles.css";
import { registerRibbonIcons } from 'src/ribbon-icons';

interface LearnieSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: LearnieSettings = {
	mySetting: 'default'
}

export default class Learnie extends Plugin {
	settings: LearnieSettings;

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

		registerRibbonIcons(this)
	}


	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



// class SampleSettingTab extends PluginSettingTab {
// 	plugin: Learnie;

// 	constructor(app: App, plugin: Learnie) {
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
