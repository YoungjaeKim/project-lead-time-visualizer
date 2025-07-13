import React, { useState, useEffect } from 'react';
import { Workspace, Project } from '../types';
import { workspaceApi } from '../services/api';
import ProjectRow from '../components/ProjectRow';

const Home: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspaceApi.getAll();
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setSelectedWorkspace(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load workspaces');
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    window.location.href = `/project/${project._id}`;
  };

  const getTotalProjects = () => selectedWorkspace?.projects?.length || 0;
  const getActiveProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'active').length || 0;
  const getCompletedProjects = () => 
    selectedWorkspace?.projects?.filter(p => p.status === 'completed').length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadWorkspaces}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Project Lead Time Visualizer</h1>
            
            {workspaces.length > 1 && (
              <select
                value={selectedWorkspace?._id || ''}
                onChange={(e) => {
                  const workspace = workspaces.find(w => w._id === e.target.value);
                  setSelectedWorkspace(workspace || null);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {workspaces.map(workspace => (
                  <option key={workspace._id} value={workspace._id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedWorkspace ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedWorkspace.name}</h2>
              {selectedWorkspace.description && (
                <p className="text-gray-600">{selectedWorkspace.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{getTotalProjects()}</div>
                <div className="text-gray-600">Total Projects</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{getActiveProjects()}</div>
                <div className="text-gray-600">Active Projects</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-gray-600">{getCompletedProjects()}</div>
                <div className="text-gray-600">Completed Projects</div>
              </div>
            </div>

            {selectedWorkspace.projects && selectedWorkspace.projects.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Projects</h3>
                <div className="grid gap-4">
                  {selectedWorkspace.projects.map(project => (
                    <ProjectRow
                      key={project._id}
                      project={project}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No projects found</div>
                <p className="text-gray-600">This workspace doesn't have any projects yet.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No workspaces found</div>
            <p className="text-gray-600">Create a workspace to get started with project tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;