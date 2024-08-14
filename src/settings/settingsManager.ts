import { Plugin } from "obsidian";
import { LearnieSettings } from ".";


export class SettingsManager {
  private settings: LearnieSettings;
  private plugin: Plugin;

  constructor(settings: LearnieSettings, plugin: Plugin) {
    this.settings = settings;
    this.plugin = plugin;
  }

  

  getSetting(key: keyof LearnieSettings) {
    return this.settings[key];
  }

  updateSetting(key: keyof LearnieSettings, value: any) {
    this.settings[key] = value;
    this.plugin.saveData(this.settings);
    // You might want to add a method to save settings back to the plugin
  }
}
