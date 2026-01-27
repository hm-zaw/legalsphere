"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRACTICE_AREAS = [
  "Corporate Law",
  "Criminal Law", 
  "Family Law",
  "Real Estate Law",
  "Intellectual Property",
  "Tax Law",
  "Immigration Law",
  "Employment Law",
  "Environmental Law",
  "Civil Litigation",
  "Bankruptcy Law",
  "Healthcare Law"
];

const AVAILABILITY_OPTIONS = [
  "Available",
  "Busy",
  "On Leave",
  "Not Available"
];

export default function CreateLawyerForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    experience: "",
    case_types: [],
    years_experience: "",
    availability: "Available",
    case_history_summary: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCaseTypeToggle = (caseType) => {
    setFormData(prev => ({
      ...prev,
      case_types: prev.case_types.includes(caseType)
        ? prev.case_types.filter(ct => ct !== caseType)
        : [...prev.case_types, caseType]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (formData.case_types.length === 0) {
      setError("Please select at least one practice area");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Admin authentication required");
      }

      const response = await fetch("/api/admin/create-lawyer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          specialization: formData.specialization,
          experience: formData.experience,
          case_types: formData.case_types,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          availability: formData.availability,
          case_history_summary: formData.case_history_summary
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lawyer");
      }

      setSuccess("Lawyer created successfully!");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        specialization: "",
        experience: "",
        case_types: [],
        years_experience: "",
        availability: "Available",
        case_history_summary: ""
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/admin-dashboard");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-lg ring-1 ring-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">Create New Lawyer Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500/50 rounded text-green-200 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="john@lawfirm.com"
            />
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Min 8 characters"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        {/* Professional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., Corporate Litigation"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              name="years_experience"
              value={formData.years_experience}
              onChange={handleInputChange}
              min="0"
              max="50"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="5"
            />
          </div>
        </div>

        {/* General Experience */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            General Experience Description
          </label>
          <textarea
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Brief description of overall experience..."
          />
        </div>

        {/* Practice Areas */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Practice Areas * (Select at least one)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {PRACTICE_AREAS.map((area) => (
              <label key={area} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.case_types.includes(area)}
                  onChange={() => handleCaseTypeToggle(area)}
                  className="w-4 h-4 text-amber-500 bg-zinc-800 border-zinc-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-300">{area}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Availability Status
          </label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Case History Summary */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Case History Summary
          </label>
          <textarea
            name="case_history_summary"
            value={formData.case_history_summary}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Summary of notable cases and achievements..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-amber-500 text-zinc-900 rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Creating..." : "Create Lawyer"}
          </button>
        </div>
      </form>
    </div>
  );
}
