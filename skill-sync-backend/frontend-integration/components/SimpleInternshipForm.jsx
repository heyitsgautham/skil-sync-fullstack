import React, { useState } from 'react';
import InternshipService from '../services/InternshipService';
import SkillExtractor from './SkillExtractor';
import SkillsManager from './SkillsManager';
import './SimpleInternshipForm.css';

/**
 * Simplified Internship Form with integrated Skill Extraction
 * This is a cleaner version using the modular components
 */
const SimpleInternshipForm = () => {
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
  const [message, setMessage] = useState({ type: '', text: '' });

  /**
   * Handle skills extraction
   */
  const handleSkillsExtracted = (extractedSkills) => {
    setFormData({
      ...formData,
      required_skills: extractedSkills.required_skills,
      preferred_skills: extractedSkills.preferred_skills
    });
    
    showMessage('success', 'Skills extracted successfully! You can edit them below.');
  };

  /**
   * Handle skills update from SkillsManager
   */
  const handleSkillsChange = (updatedSkills) => {
    setFormData({
      ...formData,
      ...updatedSkills
    });
  };

  /**
   * Show message to user
   */
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await InternshipService.createInternship(formData);
      showMessage('success', '✅ Internship posted successfully!');
      
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
      }, 2000);

    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to post internship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-internship-form">
      <div className="form-header">
        <h1>Create Internship Posting</h1>
        <p className="subtitle">Fill in the details below to post a new internship opportunity</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-field">
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

        {/* Description */}
        <div className="form-field">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the role, responsibilities, requirements, and qualifications..."
            rows={12}
            required
          />
          <small className="field-hint">
            {formData.description.length} characters 
            {formData.description.length >= 50 
              ? ' ✓ Ready for skill extraction' 
              : ` (${50 - formData.description.length} more needed for extraction)`}
          </small>
        </div>

        {/* Skill Extractor */}
        <SkillExtractor
          description={formData.description}
          onSkillsExtracted={handleSkillsExtracted}
          requiredSkills={formData.required_skills}
          preferredSkills={formData.preferred_skills}
        />

        {/* Skills Manager */}
        <SkillsManager
          requiredSkills={formData.required_skills}
          preferredSkills={formData.preferred_skills}
          onChange={handleSkillsChange}
        />

        {/* Additional Details */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Remote, Hybrid, or City"
            />
          </div>

          <div className="form-field">
            <label htmlFor="duration">Duration</label>
            <input
              type="text"
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 3 months"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="stipend">Stipend</label>
          <input
            type="text"
            id="stipend"
            value={formData.stipend}
            onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
            placeholder="e.g., $1500/month or Unpaid"
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
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

export default SimpleInternshipForm;
