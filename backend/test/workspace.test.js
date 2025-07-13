const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');

describe('Workspace API', () => {
  beforeAll(async () => {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A test workspace',
        owner: new mongoose.Types.ObjectId(),
        members: []
      };

      const response = await request(app)
        .post('/api/workspaces')
        .send(workspaceData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(workspaceData.name);
      expect(response.body.description).toBe(workspaceData.description);
    });

    it('should return 400 for invalid workspace data', async () => {
      const invalidData = {
        description: 'Missing required name field'
      };

      await request(app)
        .post('/api/workspaces')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should return empty array when no workspaces exist', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});