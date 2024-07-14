import { Notice, TFile, Vault } from "obsidian"
import {parse, stringify} from 'yaml'

export const BASE_FOLDER_PATH = "_Learnie History"

export async function createNewFile(vault: Vault, filename: string, content: string) {
    const folderPath = BASE_FOLDER_PATH
    const fileName = `${filename}.md`
    const filePath = `${folderPath}/${fileName}`;
    const folder = vault.getAbstractFileByPath(folderPath)
    if (!folder) {
        vault.createFolder(folderPath)
    }

    let file: TFile | null = null;
    try {
        file = await vault.create(filePath, content)
        new Notice(`File created: ${file.name}`)
    } catch (err) {
        console.error(err);
        new Notice(`Error creating file: ${err}`)
        
    }
    return file;
}

export async function modifyFile(vault: Vault, file: TFile, content: string) {
    try {
        await vault.modify(file, content)
        console.info(`File modified: ${file.name}`)
    } catch (err) {
        console.error(err);
    }

}

export async function deleteFile(vault: Vault, file: TFile) {
    try {
        await vault.delete(file)
        new Notice(`File deleted: ${file.name}`)
    } catch (err) {
        console.error(err);
        new Notice(`Error deleting file: ${err}`)
    }
}

const frontmatterRegex = /^---\n([\s\S]*?)\n---/;

export async function readFrontmatter(file: TFile): Promise<Record<string, any>> {
    const fileContent = await this.app.vault.read(file);

    const match = fileContent.match(frontmatterRegex);

    if (match) {
        return parse(match[1]);
    }

    return {};

}

export async function modifyFrontmatter(file: TFile, newFrontmatter: Record<string, any>) {
    const fileContent = await this.app.vault.read(file);

    // Extract the existing frontmatter
    let existingFrontmatter = {};
    let contentWithoutFrontmatter = fileContent;

    existingFrontmatter = await readFrontmatter(file)
    existingFrontmatter
    if (existingFrontmatter) {
        contentWithoutFrontmatter = fileContent.replace(frontmatterRegex, '').trim();
    }

    // Merge the existing frontmatter with the new frontmatter
    
    const updatedFrontmatter = {
        ...existingFrontmatter,
        ...newFrontmatter
    };

    // Convert the updated frontmatter to YAML
    const updatedFrontmatterYAML = stringify(updatedFrontmatter);

    // Construct the new file content with the updated frontmatter
    const updatedContent = `---\n${updatedFrontmatterYAML}---\n\n${contentWithoutFrontmatter}`;

    // Write the updated content back to the file
    await this.app.vault.modify(file, updatedContent);

    console.log(`Frontmatter updated for ${file.path}`);
}
