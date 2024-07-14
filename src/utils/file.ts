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

export function readFrontmatter(fileContent: string): Record<string, any> {
    const match = fileContent.match(frontmatterRegex);
    if (match) {
        const frontmatter = parse(match[1])
        return frontmatter
    }
    return {}
}

export function readContentWithoutFrontmatter(fileContent: string) {
    const match = fileContent.match(frontmatterRegex);

    if (match) {
        return fileContent.replace(frontmatterRegex, '').trim();
    }

    return fileContent;

} 

type FileContent = {
    frontmatter: Record<string, any>;
    content: string;
}

export async function readFileContent(file: TFile): Promise<FileContent> {
    const fileContent = await this.app.vault.read(file);
    const frontmatter = readFrontmatter(fileContent);
    const content = readContentWithoutFrontmatter(fileContent);

    return { frontmatter, content, };
}


export async function modifyFrontmatter(file: TFile, newFrontmatter: Record<string, any>) {
    const { frontmatter: existingFrontmatter, content: contentWithoutFrontmatter } = await readFileContent(file);

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
