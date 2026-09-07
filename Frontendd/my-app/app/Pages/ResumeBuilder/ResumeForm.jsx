import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const SectionHeader = ({ title, onAdd }) => (
    <div className="flex justify-between items-center mb-4 mt-8 pb-2 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                <Plus size={16} /> Add New
            </button>
        )}
    </div>
);

const ResumeForm = ({ data, onChange, onSectionChange }) => {

    const handleChange = (section, field, value) => {
        onChange(section, { ...data[section], [field]: value });
    };

    // Generic handler for array inputs (Experience, Education, etc.)
    const handleArrayChange = (section, id, field, value) => {
        const newArray = data[section].map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onSectionChange(section, newArray);
    };

    const addItem = (section, template) => {
        onSectionChange(section, [...data[section], { ...template, id: Date.now() }]);
    };

    const removeItem = (section, id) => {
        onSectionChange(section, data[section].filter(item => item.id !== id));
    };

    return (
        <div className="resume-form space-y-6">
            {/* Personal Info */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" value={data.personalInfo.fullName} onChange={(e) => handleChange('personalInfo', 'fullName', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                    <input type="text" placeholder="Job Title" value={data.personalInfo.jobTitle} onChange={(e) => handleChange('personalInfo', 'jobTitle', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                    <input type="email" placeholder="Email" value={data.personalInfo.email} onChange={(e) => handleChange('personalInfo', 'email', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                    <input type="tel" placeholder="Phone" value={data.personalInfo.phone} onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                    <input type="text" placeholder="Location" value={data.personalInfo.location} onChange={(e) => handleChange('personalInfo', 'location', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                    <input type="url" placeholder="Website / LinkedIn" value={data.personalInfo.website} onChange={(e) => handleChange('personalInfo', 'website', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                </div>
            </div>

            {/* Summary */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b border-gray-200 pb-2">Professional Summary</h3>
                <textarea placeholder="Write a brief summary of your career..." value={data.summary} onChange={(e) => onChange('summary', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 transition-all" />
            </div>

            {/* Experience */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SectionHeader title="Experience" onAdd={() => addItem('experience', { role: '', company: '', dates: '', bullets: '' })} />
                <div className="space-y-4">
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group transition-all hover:shadow-md">
                            <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input type="text" placeholder="Role / Job Title" value={exp.role} onChange={(e) => handleArrayChange('experience', exp.id, 'role', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange('experience', exp.id, 'company', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Dates (e.g., 2020 - Present)" value={exp.dates} onChange={(e) => handleArrayChange('experience', exp.id, 'dates', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <textarea placeholder="Description / Bullets (One per line)" value={exp.bullets} onChange={(e) => handleArrayChange('experience', exp.id, 'bullets', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 h-24" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SectionHeader title="Education" onAdd={() => addItem('education', { degree: '', institution: '', dates: '' })} />
                <div className="space-y-4">
                    {data.education.map((edu) => (
                        <div key={edu.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group transition-all hover:shadow-md">
                            <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => handleArrayChange('education', edu.id, 'degree', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Institution" value={edu.institution} onChange={(e) => handleArrayChange('education', edu.id, 'institution', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Dates" value={edu.dates} onChange={(e) => handleArrayChange('education', edu.id, 'dates', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SectionHeader title="Projects" onAdd={() => addItem('projects', { title: '', link: '', description: '' })} />
                <div className="space-y-4">
                    {data.projects.map((proj) => (
                        <div key={proj.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group transition-all hover:shadow-md">
                            <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input type="text" placeholder="Project Title" value={proj.title} onChange={(e) => handleArrayChange('projects', proj.id, 'title', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="url" placeholder="Project Link (Optional)" value={proj.link} onChange={(e) => handleArrayChange('projects', proj.id, 'link', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <textarea placeholder="Description" value={proj.description} onChange={(e) => handleArrayChange('projects', proj.id, 'description', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 h-20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SectionHeader title="Skills" onAdd={() => addItem('skills', { name: '', proficiency: '' })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.skills.map((skill) => (
                        <div key={skill.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200 group">
                            <input type="text" placeholder="Skill Name" value={skill.name} onChange={(e) => handleArrayChange('skills', skill.id, 'name', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            <input type="text" placeholder="Level (e.g. Expert)" value={skill.proficiency} onChange={(e) => handleArrayChange('skills', skill.id, 'proficiency', e.target.value)} className="w-1/3 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            <button onClick={() => removeItem('skills', skill.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Certifications */}
            <div className="form-section bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SectionHeader title="Certifications" onAdd={() => addItem('certifications', { name: '', issuer: '', date: '' })} />
                <div className="space-y-4">
                    {data.certifications.map((cert) => (
                        <div key={cert.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group transition-all hover:shadow-md">
                            <button onClick={() => removeItem('certifications', cert.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => handleArrayChange('certifications', cert.id, 'name', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Issuer" value={cert.issuer} onChange={(e) => handleArrayChange('certifications', cert.id, 'issuer', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Date" value={cert.date} onChange={(e) => handleArrayChange('certifications', cert.id, 'date', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResumeForm;
