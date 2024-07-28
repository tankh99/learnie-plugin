import { App, Notice, TFile, Vault } from "obsidian"
import {parse, stringify} from 'yaml'

export const BASE_FOLDER_PATH = "_learnie";
export const NOTE_FOLDER_PATH = `${BASE_FOLDER_PATH}/Note Revisions`;
export const QUESTION_FOLDER_PATH = `${BASE_FOLDER_PATH}/Questions`;

export async function getFile(folderPath: string, filename: string) {
    const vault = this.app.vault;
    const fileName = `${filename}.md`
    const filePath = `${folderPath}/${fileName}`;
    const file = vault.getFileByPath(filePath)
    return file;
}

export async function createNewFile(vault: Vault, folderPath: string, filename: string, content: string) {
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
        await vault.trash(file, true)
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

    // console.log(`Frontmatter updated for ${file.path}`);
}

// Checks to see if a plugin-created file (e.g. Note revision or question) is valid by checking if
// baclinks > 0
export function checkIfDerivativeFileIsValid(file: TFile) {
    // Note: We use any explicityly here because typings for getBacklinksForfile function is not available in TS
    const metadataCache: any = this.app.metadataCache;
    const backlinksDict = metadataCache.getBacklinksForFile(file).data;
    return Object.keys(backlinksDict).length > 0
}

