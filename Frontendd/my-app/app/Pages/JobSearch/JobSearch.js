"use client";
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Building, Briefcase, ArrowRight, Loader, AlertCircle } from 'lucide-react';

// --- Helper Components ---

// A simple loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8 col-span-full">
    <Loader className="animate-spin text-blue-600" size={48} />
  </div>
);

// An error message component
const ErrorDisplay = ({ message }) => (
  <div className="col-span-full bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center justify-center gap-3">
    <AlertCircle size={24} />
    <p className="text-lg">{message}</p>
  </div>
);

// The component to display a single job card
const JobCard = ({ job }) => (
  <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 flex flex-col h-full hover:border-blue-300 transition-all duration-300">
    <div className="flex-grow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-blue-600">{job.job_title}</h3>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Building size={16} /> {job.employer_name}
          </p>
        </div>
        <img 
          src={job.employer_logo || 'https://placehold.co/64x64/e0e7ff/4f46e5?text=Logo'} 
          alt={`${job.employer_name} logo`} 
          className="w-16 h-16 rounded-full object-contain bg-gray-100 p-1 ml-4"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64/e0e7ff/4f46e5?text=Logo'; }}
        />
      </div>
      <div className="text-gray-600 space-y-2">
        <p className="flex items-center gap-2">
          <MapPin size={16} /> 
          {[job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ')}
        </p>
        {job.job_employment_type && (
          <p className="flex items-center gap-2 capitalize">
            <Briefcase size={16} /> {job.job_employment_type.toLowerCase().replace(/_/g, ' ')}
          </p>
        )}
      </div>
    </div>
    <div className="mt-6">
      <a
        href={job.job_apply_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 bg-blue-600 rounded-xl font-bold text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105"
      >
        Apply Now <ArrowRight size={16} />
      </a>
    </div>
  </div>
);


// --- Main App Component ---

export default function JobSearch() {
  // State for search inputs, jobs, loading, and errors
  const [searchQuery, setSearchQuery] = useState('React developer');
  const [location, setLocation] = useState('Mumbai, India');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false); // To track if a search has been performed

  // --- API Key ---
  const apiKey = '3dd86c0e2fmsha2c8756acb6760fp1a3d36jsnc06d156b72e1';

  // Function to handle the job search API call
  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) {
      setError("Please enter a job title or keyword to search.");
      return;
    }
    if (!apiKey) {
      setError("API Key is missing. Please add it to your .env.local file.");
      return;
    }

    setLoading(true);
    setError(null);
    setJobs([]);
    setSearched(true);

    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: searchQuery,
        location: location,
        num_pages: '1', // Fetches about 20-30 jobs
        radius: '100'
      },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      const validJobs = response.data?.data?.filter(job => job.job_title && job.employer_name && job.job_apply_link) || [];
      setJobs(validJobs);
      if (validJobs.length === 0) {
          setError("No jobs found for this search. Try different keywords or a broader location.");
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch jobs. The API might be down or your key is invalid.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, apiKey]); // Dependencies for useCallback

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Search for jobs from LinkedIn, Indeed, and more, all in one place.
          </p>
        </header>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 mb-8 border border-gray-200 flex flex-col sm:flex-row items-center gap-4 sticky top-4 z-10">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="relative w-full sm:flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state, or country"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Job Results Section */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <LoadingSpinner />}
          {error && <ErrorDisplay message={error} />}
          {!loading && !error && jobs.map((job) => (
            <JobCard key={job.job_id || Math.random()} job={job} />
          ))}
          {/* Initial state message */}
          {!loading && !searched && (
            <div className="col-span-full text-center text-gray-400 p-8">
              <p className="text-xl">Start by searching for a job to see results here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
