import { App, FrontMatterCache, Notice, TFile, Vault } from "obsidian"

export const BASE_FOLDER_PATH = "_learnie";
export const NOTE_FOLDER_PATH = `${BASE_FOLDER_PATH}/Note Revisions`;
export const QUESTION_FOLDER_PATH = `${BASE_FOLDER_PATH}/Questions`;

export async function getUniqueFileName(baseName: string, extension: string) {
    let increment = 0;
    let fileName = `${baseName}.${extension}`;
    while (await this.app.vault.adapter.exists(fileName)) {
        increment++;
        fileName = `${baseName}_${increment > 0 ? increment : ''}.${extension}`;
    }
    return fileName.split(".").slice(0, -1).join(".");
}

/**
 * Gets a file by a specific folder path and file name. Mostly used to get generated files like revisions and questions
 * @param folderPath Folder path, e.g. NOTE_FOLDER_PATH
 * @param filename file name to get
 * @returns 
 */
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
        console.info(`Creating file: ${filePath}`)
        file = await vault.create(filePath, content)
        new Notice(`File created: ${file.name}`)
    } catch (err) {
        console.error(`File path: ${filePath} Error: ${err}`);
        new Notice(`${err}`)
        
    }
    return file;
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

export function readFrontmatter(file: TFile): FrontMatterCache {
    const app: App = this.app;
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    return frontmatter ?? {};
}

export function readContentWithoutFrontmatter(fileContent: string) {
    const match = fileContent.match(frontmatterRegex);

    if (match) {
        return fileContent.replace(frontmatterRegex, '').trim();
    }

    return fileContent;

} 

type FileContent = {
    frontmatter: FrontMatterCache | undefined;
    content: string;
}

export async function readFileContent(file: TFile): Promise<FileContent> {
    const fileContent = await this.app.vault.read(file);
    const frontmatter = readFrontmatter(file);
    const content = readContentWithoutFrontmatter(fileContent);

    return { frontmatter, content, };
}


export async function modifyFrontmatter(file: TFile, newFrontmatter: Record<string, any>) {
    const app: App = this.app;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        Object.assign(frontmatter, newFrontmatter);
    })
}

// Checks to see if a plugin-created file (e.g. Note revision or question) is valid by checking if
// baclinks > 0
export function checkIfDerivativeFileIsValid(file: TFile) {
    // Note: We use any explicityly here because typings for getBacklinksForfile function is not available in TS
    const metadataCache: any = this.app.metadataCache;
    const backlinksDict = metadataCache.getBacklinksForFile(file).data;
    return Object.keys(backlinksDict).length > 0
}

