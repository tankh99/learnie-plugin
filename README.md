# Learnie: Enhance Your Learning with Active Recall and Spaced Repetition

**Note**: Learnie is in early development and may have some instabilities. Regular updates will be provided to improve functionality and user experience.

**Issues/Suggestions**: Please report any issues encountered or feature suggestions as a GitHub issue. For issues, include the context as well as screenshots (if applicable) so that it's easier to reproduce the error 

## Introduction

Learnie is an Obsidian plugin designed to help students and lifelong learners remember and learn more effectively. By incorporating contemporary learning techniques like active recall and spaced repetition, Learnie transforms your Obsidian vault into a powerful learning tool.

## Key Features

### 1. Convert Files to Notes for Tracking

Easily convert any file into a note by typing the command "Convert to note". This process updates the frontmatter of the file to include a unique note ID and links to additional resources.

### 2. Track Changes with the Diff View

Each tracked note is assigned an ID and includes links to view the differences between the current note and the last modified version. This feature allows you to see what has changed in your notes over time, helping you keep track of your revisions and edits effortlessly.

### 3. Create and Review Questions

Create review questions directly within your notes. Select text to automatically use it as an answer, streamlining the question creation process. This feature uses the flashcard strategy and helps you prepare for exams by regularly reviewing the questions you've created.

### 4. Daily Review

View all notes that were changed in a day, facilitating regular review sessions and helping you stay on top of your learning material.

### 5. Review Marking

Mark note revisions as reviewed to keep track of your progress and ensure no changes slip through the cracks.

## Perfect for

- Students overwhelmed by large amounts of content to memorize
- Obsidian users looking to enhance their note-taking and learning process
- Anyone who believes in the power of accumulated learning over cramming

## How It Works

1. Convert your existing files into tracked notes using the "Convert to note" command.
2. Make edits to your notes as usual.
3. At the end of the day, use the "Review notes" command to view all notes changed within the day. OR Use the provided links to view individual file diffs.
    1. Check on the Reviewed checkbox so that Learnie knows to replace the note revision when you update the note tomorrow
4. Create questions for active recall by selecting text and using the question creation command.
5. Review your daily changes to reinforce your learning.
6. Mark revisions as reviewed to maintain your learning progress.

## Commands
1. Convert to note - Converts a file into a note, and edits are tracked
2. Review notes - View list of all notes that were changed within the day OR has not yet been reviewed (This means that only notes in the past nad haven't yet been reviewed will show up in this list)
3. View questions - Views a list of all created questions for the active file
4. Create question - Creates a new question. highlighted text will automatically be used as the answer of the question pair
5. Clean up unused files - This removes all note revisions and files that are not used by any notes (This should not be needed)

---

## Planned Enhancements
- [ ] Review Questions: Opens a view with 10 random questions that have not yet been reviewed today
- [ ] Easier navigation between changed notes

## (Really) Future Enhancements
- [ ] Create questions with context
	- [ ] Users can create multiple questions for the same context

## Completed features
- [x] Fix bug where text is deleted after being idle on an active note for a some time
- [x] Allow users to modify questions
- [x] Add daily notification which reminds users to review their notes at a certain time
