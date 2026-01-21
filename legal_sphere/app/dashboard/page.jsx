"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('userData');
    
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    setUserData(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium tracking-wide text-zinc-900">
                LEGALSPHERE
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">
                Welcome, {userData?.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="mt-2 text-zinc-600">Welcome to your temporary user home page.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-zinc-200">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Documents</h3>
            <p className="text-zinc-600 text-sm mb-4">Manage your legal documents</p>
            <button className="text-sm font-medium text-zinc-900 hover:text-zinc-700">
              View Documents →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-zinc-200">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Appointments</h3>
            <p className="text-zinc-600 text-sm mb-4">Schedule and view appointments</p>
            <button className="text-sm font-medium text-zinc-900 hover:text-zinc-700">
              Manage Appointments →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-zinc-200">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Legal Help</h3>
            <p className="text-zinc-600 text-sm mb-4">Get legal assistance</p>
            <button className="text-sm font-medium text-zinc-900 hover:text-zinc-700">
              Get Help →
            </button>
          </div>
        </div>

        {/* New Case Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-zinc-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Submit New Case</h2>
              <p className="text-zinc-600 text-sm mt-1">Start a new legal case request with our team</p>
            </div>
            <button
              onClick={() => router.push('/apply-new')}
              className="bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Apply for New Case
            </button>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">Ready to get started?</p>
                <p className="text-xs text-zinc-600">Fill out our comprehensive case form to begin your legal journey</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-600">Name</p>
              <p className="font-medium text-zinc-900">{userData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Email</p>
              <p className="font-medium text-zinc-900">{userData?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Account Status</p>
              <p className="font-medium text-green-600">Active</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Member Since</p>
              <p className="font-medium text-zinc-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Temporary Dashboard</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This is a temporary user home page. The full dashboard with all features will be available soon.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
