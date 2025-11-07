import React, { useState } from 'react';
import InternshipService from '../services/InternshipService';
import './SkillExtractor.css';

/**
 * Reusable Skill Extractor Component
 * Can be used in create or edit internship forms
 */
const SkillExtractor = ({ 
  description, 
  onSkillsExtracted,
  requiredSkills = [],
  preferredSkills = []
}) => {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    if (!description || description.length < 50) {
      setError('Description must be at least 50 characters long.');
      return;
    }

    setExtracting(true);
    setError('');

    try {
      const result = await InternshipService.extractSkills(description);
      
      // Call parent callback with extracted skills
      if (onSkillsExtracted) {
        onSkillsExtracted({
          required_skills: result.required_skills,
          preferred_skills: result.preferred_skills
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Failed to extract skills. Please try again.'
      );
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="skill-extractor">
      <button
        type="button"
        className="extract-button"
        onClick={handleExtract}
        disabled={extracting || description.length < 50}
      >
        {extracting ? (
          <>
            <span className="spinner-small"></span>
            Extracting Skills...
          </>
        ) : (
          <>
            <span className="icon">🔍</span>
            Extract Skills from Description
          </>
        )}
      </button>

      {error && <div className="extract-error">{error}</div>}

      {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
        <div className="extraction-summary">
          <span className="summary-text">
            ✓ Extracted {requiredSkills.length} required and {preferredSkills.length} preferred skills
          </span>
        </div>
      )}

      <small className="extract-hint">
        AI will automatically categorize skills based on your job description
      </small>
    </div>
  );
};

export default SkillExtractor;
