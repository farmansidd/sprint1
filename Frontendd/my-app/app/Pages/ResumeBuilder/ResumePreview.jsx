
import React from 'react';

const ResumePreview = ({ data, activeTheme }) => {
    const { personalInfo, summary, experience, education, projects, skills, certifications } = data;

    return (
        <div className="resume-preview-container bg-white shadow-xl rounded-lg overflow-hidden min-h-[800px]">
            {/* Dynamic Theme Injection */}
            <link rel="stylesheet" href={`/themes/${activeTheme}`} />

            <div className="resume-container">
                {/* Header Section */}
                <header className="resume-header">
                    <h1 className="resume-name">{personalInfo?.fullName || 'Your Name'}</h1>
                    <p className="resume-title">{personalInfo?.jobTitle || 'Professional Title'}</p>
                    <div className="resume-contact-info">
                        {personalInfo?.email && <span className="resume-contact-item">{personalInfo.email}</span>}
                        {personalInfo?.phone && <span className="resume-contact-item">{personalInfo.phone}</span>}
                        {personalInfo?.location && <span className="resume-contact-item">{personalInfo.location}</span>}
                        {personalInfo?.website && <span className="resume-contact-item">{personalInfo.website}</span>}
                    </div>
                </header>

                {/* Summary Section */}
                {summary && (
                    <section className="resume-section resume-summary">
                        <h2 className="resume-section-title">Summary</h2>
                        <p className="resume-summary-text">{summary}</p>
                    </section>
                )}

                {/* Experience Section */}
                {experience?.length > 0 && (
                    <section className="resume-section resume-experience">
                        <h2 className="resume-section-title">Experience</h2>
                        {experience.map((exp) => (
                            <div key={exp.id} className="resume-item">
                                <div className="resume-item-header">
                                    <h3 className="resume-item-title">{exp.role}</h3>
                                    <span className="resume-item-date">{exp.dates}</span>
                                </div>
                                <h4 className="resume-item-subtitle">{exp.company}</h4>
                                <p className="resume-item-description">{exp.bullets}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Projects Section */}
                {projects?.length > 0 && (
                    <section className="resume-section resume-projects">
                        <h2 className="resume-section-title">Projects</h2>
                        {projects.map((proj) => (
                            <div key={proj.id} className="resume-item">
                                <div className="resume-item-header">
                                    <h3 className="resume-item-title">
                                        {proj.title}
                                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="resume-item-link">Link</a>}
                                    </h3>
                                </div>
                                <p className="resume-item-description">{proj.description}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Education Section */}
                {education?.length > 0 && (
                    <section className="resume-section resume-education">
                        <h2 className="resume-section-title">Education</h2>
                        {education.map((edu) => (
                            <div key={edu.id} className="resume-item">
                                <div className="resume-item-header">
                                    <h3 className="resume-item-title">{edu.degree}</h3>
                                    <span className="resume-item-date">{edu.dates}</span>
                                </div>
                                <h4 className="resume-item-subtitle">{edu.institution}</h4>
                            </div>
                        ))}
                    </section>
                )}

                {/* Skills Section */}
                {skills?.length > 0 && (
                    <section className="resume-section resume-skills">
                        <h2 className="resume-section-title">Skills</h2>
                        <ul className="resume-skills-list">
                            {skills.map((skill) => (
                                <li key={skill.id} className="resume-skill-item">
                                    {skill.name} {skill.proficiency && <span className="resume-skill-proficiency">({skill.proficiency})</span>}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {/* Certifications Section */}
                {certifications?.length > 0 && (
                    <section className="resume-section resume-certifications">
                        <h2 className="resume-section-title">Certifications</h2>
                        {certifications.map((cert) => (
                            <div key={cert.id} className="resume-item">
                                <h3 className="resume-item-title">{cert.name}</h3>
                                <p className="resume-item-subtitle">{cert.issuer} {cert.date && `- ${cert.date}`}</p>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
};

export default ResumePreview;
