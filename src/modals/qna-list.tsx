import { ItemView, WorkspaceLeaf } from 'obsidian';
import { useState, useEffect } from "react";
import { QuestionAnswerPair } from '../types/types';
import { activateQuestionListView } from 'src/views';

type P = {
  frontmatterQuestions: QuestionAnswerPair[]
}

export const QUESTIONS_LIST_VIEW = "questions-list-view"

class QuestionsListView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return QUESTIONS_LIST_VIEW;
  }

  getDisplayText() {
    return 'Questions';
  }

  async onOpen() {
    this.contentEl.empty();
    this.renderView();
  }

  async onClose() {
    this.contentEl.empty();
  }

  async renderView() {
    activateQuestionListView(true)
  }

}

export default QuestionsListView;

const QuestionsListviewComponent = () => {

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    // Load questions from frontmatter on component mount
    const frontmatterQuestions = getFrontmatterQuestions();
    setQuestions(frontmatterQuestions);
  }, []);

  const getFrontmatterQuestions = () => {
    // Logic to retrieve questions from frontmatter
    // Return an array of question objects { title, content }
    return []
  };

  const saveFrontmatterQuestions = (updatedQuestions) => {
    // Logic to save the updated questions to the frontmatter
  };

  const addQuestion = () => {
    setQuestions([...questions, newQuestion]);
    setNewQuestion({ title: '', content: '' });
  };

  const updateQuestion = (index, updatedQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
    setEditingIndex(-1);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  return (
    <div className="questions-sidebar">
      {/* <Card>
          <CardHeader>Questions</CardHeader>
          <CardContent>
            <List>
              {questions.map((question, index) => (
                <ListItem key={index}>
                  <ListItemButton onClick={() => setEditingIndex(index)}>
                    <ListItemText primary={question.title} secondary={question.content} />
                  </ListItemButton>
                  <Button onClick={() => deleteQuestion(index)}>Delete</Button>
                </ListItem>
              ))}
            </List>
            {editingIndex !== -1 && (
              <div className="editing-question">
                <Input
                  label="Title"
                  value={questions[editingIndex].title}
                  onChange={(e) => {
                    const updatedQuestion = { ...questions[editingIndex], title: e.target.value };
                    updateQuestion(editingIndex, updatedQuestion);
                  }}
                />
                <Textarea
                  label="Content"
                  value={questions[editingIndex].content}
                  onChange={(e) => {
                    const updatedQuestion = { ...questions[editingIndex], content: e.target.value };
                    updateQuestion(editingIndex, updatedQuestion);
                  }}
                />
                <Button onClick={() => setEditingIndex(-1)}>Close</Button>
              </div>
            )}
            <Divider />
            <Input
              label="New Question Title"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            />
            <Textarea
              label="New Question Content"
              value={newQuestion.content}
              onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
            />
            <Button onClick={addQuestion}>Add Question</Button>
            <Button onClick={() => saveFrontmatterQuestions(questions)}>Save Changes</Button>
          </CardContent>
        </Card> */}
    </div>
  );
}