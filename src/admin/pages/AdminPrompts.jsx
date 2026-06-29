import { useState, useEffect } from "react";
import Section from "../../ui/Section";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import "./AdminPrompts.css";
import { HiPencil, HiCheck, HiXMark } from "react-icons/hi2";
import { backendURL } from "../../pages/Home";

export default function PromptsManager() {
  const [prompts, setPrompts] = useState([]);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editForm, setEditForm] = useState({ prompt_text: "", description: "" });

  const fetchPrompts = () => {
    fetch(`${backendURL}/prompts-api/prompts`)
      .then(res => res.json())
      .then(setPrompts)
      .catch(err => console.error("Error fetching prompts:", err));
  };

  useEffect(() => fetchPrompts(), []);

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt._id);
    setEditForm({
      prompt_text: prompt.prompt_text,
      description: prompt.description
    });
  };

  const handleSave = async (promptId) => {
    try {
      const response = await fetch(`${backendURL}/prompts-api/admin/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: promptId,
          ...editForm
        })
      });

      if (response.ok) {
        setEditingPrompt(null);
        fetchPrompts();
      } else {
        console.error("Failed to update prompt");
      }
    } catch (err) {
      console.error("Error updating prompt:", err);
    }
  };

  const handleCancel = () => {
    setEditingPrompt(null);
    setEditForm({ prompt_text: "", description: "" });
  };

  const getPromptDisplayName = (name) => {
    const nameMap = {
      "system_prompt": "System Prompt",
      "next_question_prompt": "Next Question Prompt",
      "summary_prompt": "Summary Prompt",
      "first_question_prompt": "First Question Prompt"
    };
    return nameMap[name] || name;
  };

  return (
    <Section title="Prompts Manager">
      <div className="prompts-container">
        {prompts.map(prompt => (
          <Card key={prompt._id} className="prompt-card">
            <div className="prompt-header">
              <div>
                <h4 className="prompt-title">{getPromptDisplayName(prompt.name)}</h4>
                <p className="prompt-subtitle">{prompt.description}</p>
              </div>
              {editingPrompt !== prompt._id && (
                <button 
                  className="btn-icon" 
                  onClick={() => handleEdit(prompt)}
                  title="Edit Prompt"
                >
                  <HiPencil />
                </button>
              )}
            </div>

            {editingPrompt === prompt._id ? (
              <div className="prompt-edit-form">
                <div className="form-group">
                  <label className="label-ui">Prompt Text</label>
                  <textarea
                    className="textarea-ui"
                    rows="12"
                    value={editForm.prompt_text}
                    onChange={(e) => setEditForm({...editForm, prompt_text: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label-ui">Description</label>
                  <input
                    type="text"
                    className="input-ui"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>
                <div className="prompt-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => handleSave(prompt._id)}
                    className="btn-with-icon"
                  >
                    <HiCheck /> Save Changes
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleCancel}
                    className="btn-with-icon"
                  >
                    <HiXMark /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prompt-display">
                <textarea rows="12" className="prompt-text" readOnly>{prompt.prompt_text}</textarea>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}
