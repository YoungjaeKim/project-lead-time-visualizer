import axios from 'axios';
import cron from 'node-cron';
import { ExternalSourceConfig, Event, Project } from '../models';

export class ExternalSourceService {
  static async syncAllSources() {
    const configs = await ExternalSourceConfig.find({ isActive: true });
    
    for (const config of configs) {
      try {
        await this.syncSource(config);
      } catch (error) {
        console.error(`Sync failed for ${config.name}:`, error);
      }
    }
  }

  static async syncSource(config: any) {
    switch (config.type) {
      case 'jira':
        await this.syncJira(config);
        break;
      case 'github':
        await this.syncGitHub(config);
        break;
      case 'confluence':
        await this.syncConfluence(config);
        break;
    }
    
    config.lastSyncAt = new Date();
    await config.save();
  }

  static async syncJira(config: any) {
    const { baseUrl, credentials, projectMappings } = config;
    
    for (const mapping of projectMappings) {
      try {
        const response = await axios.get(
          `${baseUrl}/rest/api/2/search?jql=project=${mapping.externalId}`,
          {
            auth: {
              username: credentials.username,
              password: credentials.token
            }
          }
        );

        const issues = response.data.issues;
        
        for (const issue of issues) {
          await this.createOrUpdateEventFromJira(issue, mapping.internalProjectId);
        }
      } catch (error) {
        console.error(`Jira sync error for project ${mapping.externalId}:`, error);
      }
    }
  }

  static async syncGitHub(config: any) {
    const { baseUrl, credentials, projectMappings } = config;
    
    for (const mapping of projectMappings) {
      try {
        const [owner, repo] = mapping.externalId.split('/');
        
        const issuesResponse = await axios.get(
          `${baseUrl}/repos/${owner}/${repo}/issues`,
          {
            headers: {
              Authorization: `token ${credentials.token}`
            }
          }
        );

        const issues = issuesResponse.data;
        
        for (const issue of issues) {
          await this.createOrUpdateEventFromGitHub(issue, mapping.internalProjectId);
        }

        const commitsResponse = await axios.get(
          `${baseUrl}/repos/${owner}/${repo}/commits`,
          {
            headers: {
              Authorization: `token ${credentials.token}`
            }
          }
        );

        const commits = commitsResponse.data;
        
        for (const commit of commits) {
          await this.createOrUpdateEventFromGitHubCommit(commit, mapping.internalProjectId);
        }
      } catch (error) {
        console.error(`GitHub sync error for project ${mapping.externalId}:`, error);
      }
    }
  }

  static async syncConfluence(config: any) {
    const { baseUrl, credentials, projectMappings } = config;
    
    for (const mapping of projectMappings) {
      try {
        const response = await axios.get(
          `${baseUrl}/wiki/rest/api/content?spaceKey=${mapping.externalId}`,
          {
            auth: {
              username: credentials.username,
              password: credentials.token
            }
          }
        );

        const pages = response.data.results;
        
        for (const page of pages) {
          await this.createOrUpdateEventFromConfluence(page, mapping.internalProjectId);
        }
      } catch (error) {
        console.error(`Confluence sync error for project ${mapping.externalId}:`, error);
      }
    }
  }

  static async createOrUpdateEventFromJira(issue: any, projectId: string) {
    const eventData = {
      title: issue.fields.summary,
      description: issue.fields.description,
      type: 'duration' as const,
      status: this.mapJiraStatusToEventStatus(issue.fields.status.name),
      startDate: new Date(issue.fields.created),
      endDate: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : undefined,
      referenceLinks: [{
        type: 'jira' as const,
        url: `${issue.self}`,
        title: issue.key
      }],
      projectId
    };

    const existingEvent = await Event.findOne({
      'referenceLinks.url': eventData.referenceLinks[0].url
    });

    if (existingEvent) {
      await Event.findByIdAndUpdate(existingEvent._id, eventData);
    } else {
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      await Project.findByIdAndUpdate(
        projectId,
        { $push: { events: newEvent._id } }
      );
    }
  }

  static async createOrUpdateEventFromGitHub(issue: any, projectId: string) {
    const eventData = {
      title: issue.title,
      description: issue.body,
      type: 'duration' as const,
      status: issue.state === 'closed' ? 'done' as const : 'ongoing' as const,
      startDate: new Date(issue.created_at),
      endDate: issue.closed_at ? new Date(issue.closed_at) : undefined,
      referenceLinks: [{
        type: 'github' as const,
        url: issue.html_url,
        title: `#${issue.number}`
      }],
      projectId
    };

    const existingEvent = await Event.findOne({
      'referenceLinks.url': eventData.referenceLinks[0].url
    });

    if (existingEvent) {
      await Event.findByIdAndUpdate(existingEvent._id, eventData);
    } else {
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      await Project.findByIdAndUpdate(
        projectId,
        { $push: { events: newEvent._id } }
      );
    }
  }

  static async createOrUpdateEventFromGitHubCommit(commit: any, projectId: string) {
    const eventData = {
      title: `Commit: ${commit.commit.message.split('\n')[0]}`,
      description: commit.commit.message,
      type: 'one-time' as const,
      status: 'done' as const,
      startDate: new Date(commit.commit.author.date),
      referenceLinks: [{
        type: 'github' as const,
        url: commit.html_url,
        title: commit.sha.substring(0, 7)
      }],
      projectId
    };

    const existingEvent = await Event.findOne({
      'referenceLinks.url': eventData.referenceLinks[0].url
    });

    if (!existingEvent) {
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      await Project.findByIdAndUpdate(
        projectId,
        { $push: { events: newEvent._id } }
      );
    }
  }

  static async createOrUpdateEventFromConfluence(page: any, projectId: string) {
    const eventData = {
      title: `Page: ${page.title}`,
      description: `Confluence page created/updated`,
      type: 'one-time' as const,
      status: 'done' as const,
      startDate: new Date(page.version.when),
      referenceLinks: [{
        type: 'confluence' as const,
        url: `${page._links.base}${page._links.webui}`,
        title: page.title
      }],
      projectId
    };

    const existingEvent = await Event.findOne({
      'referenceLinks.url': eventData.referenceLinks[0].url
    });

    if (existingEvent) {
      if (new Date(page.version.when) > existingEvent.startDate) {
        await Event.findByIdAndUpdate(existingEvent._id, eventData);
      }
    } else {
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      await Project.findByIdAndUpdate(
        projectId,
        { $push: { events: newEvent._id } }
      );
    }
  }

  static mapJiraStatusToEventStatus(jiraStatus: string): 'done' | 'ongoing' | 'notyet' {
    const lowerStatus = jiraStatus.toLowerCase();
    
    if (lowerStatus.includes('done') || lowerStatus.includes('closed') || lowerStatus.includes('resolved')) {
      return 'done';
    } else if (lowerStatus.includes('progress') || lowerStatus.includes('active')) {
      return 'ongoing';
    } else {
      return 'notyet';
    }
  }

  static startCronJobs() {
    cron.schedule('0 0 * * *', async () => {
      console.log('Starting daily sync of external sources...');
      await this.syncAllSources();
      console.log('Daily sync completed');
    });
  }
}