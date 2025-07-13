import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../src/pages/Home';
import * as api from '../src/services/api';

// Mock the API
jest.mock('../src/services/api');
const mockApi = api;

const mockWorkspace = {
  _id: '1',
  name: 'Test Workspace',
  description: 'A test workspace',
  projects: [
    {
      _id: 'proj1',
      name: 'Test Project',
      description: 'A test project',
      status: 'active',
      startDate: new Date('2023-01-01'),
      participants: [],
      events: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  owner: 'user1',
  members: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockApi.workspaceApi.getAll.mockReturnValue(new Promise(() => {}));
    
    renderWithRouter(<Home />);
    
    expect(screen.getByText('Loading workspaces...')).toBeInTheDocument();
  });

  it('renders workspace data when loaded', async () => {
    mockApi.workspaceApi.getAll.mockResolvedValue({
      data: [mockWorkspace]
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });
    
    expect(screen.getByText('A test workspace')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total projects
  });

  it('renders error state when API fails', async () => {
    mockApi.workspaceApi.getAll.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load workspaces')).toBeInTheDocument();
    });
  });

  it('renders empty state when no workspaces exist', async () => {
    mockApi.workspaceApi.getAll.mockResolvedValue({
      data: []
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No workspaces found')).toBeInTheDocument();
    });
  });
}); 