import React, { useState } from 'react';
import './SkillsManager.css';

/**
 * Reusable Skills Manager Component
 * Handles both required and preferred skills with add/remove/move functionality
 */
const SkillsManager = ({ 
  requiredSkills = [], 
  preferredSkills = [], 
  onChange 
}) => {
  const [newSkill, setNewSkill] = useState({ required: '', preferred: '' });

  /**
   * Add a skill to required or preferred list
   */
  const addSkill = (type) => {
    const skillValue = newSkill[type].trim();
    if (!skillValue) return;

    const skillList = type === 'required' ? requiredSkills : preferredSkills;
    
    // Check if skill already exists (case-insensitive)
    const exists = skillList.some(
      skill => skill.toLowerCase() === skillValue.toLowerCase()
    );

    if (exists) {
      alert(`Skill "${skillValue}" already exists in ${type} skills.`);
      return;
    }

    // Create updated skills object
    const updatedSkills = type === 'required' 
      ? { required_skills: [...requiredSkills, skillValue], preferred_skills: preferredSkills }
      : { required_skills: requiredSkills, preferred_skills: [...preferredSkills, skillValue] };

    onChange(updatedSkills);
    setNewSkill({ ...newSkill, [type]: '' });
  };

  /**
   * Remove a skill from required or preferred list
   */
  const removeSkill = (type, skillToRemove) => {
    const updatedSkills = type === 'required'
      ? { 
          required_skills: requiredSkills.filter(s => s !== skillToRemove), 
          preferred_skills: preferredSkills 
        }
      : { 
          required_skills: requiredSkills, 
          preferred_skills: preferredSkills.filter(s => s !== skillToRemove) 
        };

    onChange(updatedSkills);
  };

  /**
   * Move skill from one category to another
   */
  const moveSkill = (skill, fromType) => {
    const fromList = fromType === 'required' ? requiredSkills : preferredSkills;
    const toList = fromType === 'required' ? preferredSkills : requiredSkills;

    // Remove from source
    const updatedFromList = fromList.filter(s => s !== skill);

    // Add to destination (if not already there)
    const updatedToList = toList.includes(skill) 
      ? toList 
      : [...toList, skill];

    const updatedSkills = fromType === 'required'
      ? { required_skills: updatedFromList, preferred_skills: updatedToList }
      : { required_skills: updatedToList, preferred_skills: updatedFromList };

    onChange(updatedSkills);
  };

  /**
   * Handle key press for adding skills
   */
  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(type);
    }
  };

  return (
    <div className="skills-manager">
      {/* Required Skills Section */}
      <div className="skill-category">
        <label className="category-label">
          <span className="required-badge">✅</span> 
          Required Skills
          <span className="skill-count">{requiredSkills.length}</span>
        </label>
        
        <div className="skills-display">
          {requiredSkills.length === 0 ? (
            <div className="empty-state">No required skills added yet</div>
          ) : (
            requiredSkills.map((skill, index) => (
              <span key={index} className="skill-chip required">
                <span className="skill-name">{skill}</span>
                <button
                  type="button"
                  className="skill-action remove"
                  onClick={() => removeSkill('required', skill)}
                  title="Remove skill"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
                <button
                  type="button"
                  className="skill-action move"
                  onClick={() => moveSkill(skill, 'required')}
                  title="Move to preferred"
                  aria-label={`Move ${skill} to preferred`}
                >
                  ⇩
                </button>
              </span>
            ))
          )}
        </div>

        <div className="add-skill-input">
          <input
            type="text"
            value={newSkill.required}
            onChange={(e) => setNewSkill({ ...newSkill, required: e.target.value })}
            onKeyPress={(e) => handleKeyPress(e, 'required')}
            placeholder="Type skill name and press Enter"
            className="skill-input"
          />
          <button
            type="button"
            className="add-button"
            onClick={() => addSkill('required')}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Preferred Skills Section */}
      <div className="skill-category">
        <label className="category-label">
          <span className="preferred-badge">⭐</span> 
          Preferred Skills
          <span className="skill-count">{preferredSkills.length}</span>
        </label>
        
        <div className="skills-display">
          {preferredSkills.length === 0 ? (
            <div className="empty-state">No preferred skills added yet</div>
          ) : (
            preferredSkills.map((skill, index) => (
              <span key={index} className="skill-chip preferred">
                <span className="skill-name">{skill}</span>
                <button
                  type="button"
                  className="skill-action remove"
                  onClick={() => removeSkill('preferred', skill)}
                  title="Remove skill"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
                <button
                  type="button"
                  className="skill-action move"
                  onClick={() => moveSkill(skill, 'preferred')}
                  title="Move to required"
                  aria-label={`Move ${skill} to required`}
                >
                  ⇧
                </button>
              </span>
            ))
          )}
        </div>

        <div className="add-skill-input">
          <input
            type="text"
            value={newSkill.preferred}
            onChange={(e) => setNewSkill({ ...newSkill, preferred: e.target.value })}
            onKeyPress={(e) => handleKeyPress(e, 'preferred')}
            placeholder="Type skill name and press Enter"
            className="skill-input"
          />
          <button
            type="button"
            className="add-button"
            onClick={() => addSkill('preferred')}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="skills-help">
        <small>
          💡 <strong>Tip:</strong> Use ⇧⇩ buttons to move skills between required and preferred categories
        </small>
      </div>
    </div>
  );
};

export default SkillsManager;
