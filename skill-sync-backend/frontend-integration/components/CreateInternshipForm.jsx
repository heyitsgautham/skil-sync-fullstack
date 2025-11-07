import React, { useState } from 'react';
import axios from 'axios';
import './CreateInternshipForm.css';

const CreateInternshipForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: [],
    preferred_skills: [],
    location: '',
    duration: '',
    stipend: ''
  });

  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [newSkill, setNewSkill] = useState({ required: '', preferred: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get API base URL from environment or use default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  /**
   * Extract skills from job description using AI
   */
  const handleExtractSkills = async () => {
    if (!formData.description || formData.description.length < 50) {
      setError('Please write a job description of at least 50 characters before extracting skills.');
      return;
    }

    setExtracting(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/internship/extract-skills`,
        { job_description: formData.description },
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setFormData({
        ...formData,
        required_skills: response.data.required_skills || [],
        preferred_skills: response.data.preferred_skills || []
      });

      setSuccess('Skills extracted successfully! You can now edit them.');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error extracting skills:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to extract skills. Please try again or add skills manually.'
      );
    } finally {
      setExtracting(false);
    }
  };

  /**
   * Add a skill to required or preferred list
   */
  const addSkill = (type) => {
    const skillValue = newSkill[type].trim();
    if (!skillValue) return;

    const skillList = type === 'required' ? 'required_skills' : 'preferred_skills';
    
    // Check if skill already exists (case-insensitive)
    const exists = formData[skillList].some(
      skill => skill.toLowerCase() === skillValue.toLowerCase()
    );

    if (exists) {
      setError(`Skill "${skillValue}" already exists in ${type} skills.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData({
      ...formData,
      [skillList]: [...formData[skillList], skillValue]
    });

    setNewSkill({ ...newSkill, [type]: '' });
  };

  /**
   * Remove a skill from required or preferred list
   */
  const removeSkill = (type, index) => {
    const skillList = type === 'required' ? 'required_skills' : 'preferred_skills';
    setFormData({
      ...formData,
      [skillList]: formData[skillList].filter((_, i) => i !== index)
    });
  };

  /**
   * Move skill from one category to another
   */
  const moveSkill = (skill, fromType) => {
    const fromList = fromType === 'required' ? 'required_skills' : 'preferred_skills';
    const toList = fromType === 'required' ? 'preferred_skills' : 'required_skills';

    // Remove from source
    const updatedFromList = formData[fromList].filter(s => s !== skill);

    // Add to destination (if not already there)
    const updatedToList = formData[toList].includes(skill) 
      ? formData[toList] 
      : [...formData[toList], skill];

    setFormData({
      ...formData,
      [fromList]: updatedFromList,
      [toList]: updatedToList
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/internship/post`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Internship posted successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          required_skills: [],
          preferred_skills: [],
          location: '',
          duration: '',
          stipend: ''
        });
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error posting internship:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to post internship. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle key press for adding skills
   */
  const handleSkillKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(type);
    }
  };

  return (
    <div className="create-internship-form">
      <h2>Create Internship Posting</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div className="form-group">
          <label htmlFor="title">Internship Title *</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Full Stack Developer Intern"
            required
          />
        </div>

        {/* Job Description Field */}
        <div className="form-group">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter detailed job description including responsibilities, requirements, and qualifications..."
            rows={10}
            required
          />
          <small className="form-hint">
            {formData.description.length} characters 
            {formData.description.length < 50 && ` (minimum 50 required for skill extraction)`}
          </small>
        </div>

        {/* Extract Skills Button */}
        <div className="form-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExtractSkills}
            disabled={extracting || formData.description.length < 50}
          >
            {extracting ? (
              <>
                <span className="spinner"></span>
                Extracting Skills...
              </>
            ) : (
              <>
                🔍 Extract Skills from Description
              </>
            )}
          </button>
          <small className="form-hint">
            AI will automatically categorize skills into required and preferred
          </small>
        </div>

        {/* Required Skills Section */}
        <div className="form-group skills-section">
          <label>
            <span className="required-badge">✅</span> Required Skills *
          </label>
          <div className="skills-container">
            {formData.required_skills.map((skill, index) => (
              <span key={index} className="skill-tag required">
                {skill}
                <button
                  type="button"
                  className="skill-remove"
                  onClick={() => removeSkill('required', index)}
                  title="Remove skill"
                >
                  ×
                </button>
                <button
                  type="button"
                  className="skill-move"
                  onClick={() => moveSkill(skill, 'required')}
                  title="Move to preferred"
                >
                  ⇩
                </button>
              </span>
            ))}
          </div>
          <div className="skill-input-group">
            <input
              type="text"
              value={newSkill.required}
              onChange={(e) => setNewSkill({ ...newSkill, required: e.target.value })}
              onKeyPress={(e) => handleSkillKeyPress(e, 'required')}
              placeholder="Add required skill (press Enter)"
            />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => addSkill('required')}
            >
              + Add
            </button>
          </div>
          <small className="form-hint">
            {formData.required_skills.length} required skills added
          </small>
        </div>

        {/* Preferred Skills Section */}
        <div className="form-group skills-section">
          <label>
            <span className="preferred-badge">⭐</span> Preferred Skills
          </label>
          <div className="skills-container">
            {formData.preferred_skills.map((skill, index) => (
              <span key={index} className="skill-tag preferred">
                {skill}
                <button
                  type="button"
                  className="skill-remove"
                  onClick={() => removeSkill('preferred', index)}
                  title="Remove skill"
                >
                  ×
                </button>
                <button
                  type="button"
                  className="skill-move"
                  onClick={() => moveSkill(skill, 'preferred')}
                  title="Move to required"
                >
                  ⇧
                </button>
              </span>
            ))}
          </div>
          <div className="skill-input-group">
            <input
              type="text"
              value={newSkill.preferred}
              onChange={(e) => setNewSkill({ ...newSkill, preferred: e.target.value })}
              onKeyPress={(e) => handleSkillKeyPress(e, 'preferred')}
              placeholder="Add preferred skill (press Enter)"
            />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => addSkill('preferred')}
            >
              + Add
            </button>
          </div>
          <small className="form-hint">
            {formData.preferred_skills.length} preferred skills added
          </small>
        </div>

        {/* Location Field */}
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Remote, San Francisco, CA, or Hybrid"
          />
        </div>

        {/* Duration Field */}
        <div className="form-group">
          <label htmlFor="duration">Duration</label>
          <input
            type="text"
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 3 months, 6 months"
          />
        </div>

        {/* Stipend Field */}
        <div className="form-group">
          <label htmlFor="stipend">Stipend</label>
          <input
            type="text"
            id="stipend"
            value={formData.stipend}
            onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
            placeholder="e.g., $1500/month, Unpaid, Negotiable"
          />
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Posting...
              </>
            ) : (
              'Post Internship'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInternshipForm;
