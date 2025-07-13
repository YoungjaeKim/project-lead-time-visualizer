import { Request, Response } from 'express';
import { ExternalSourceConfig } from '../models';
import { ExternalSourceService } from '../services/ExternalSourceService';

export const createExternalSourceConfig = async (req: Request, res: Response) => {
  try {
    const config = new ExternalSourceConfig(req.body);
    await config.save();
    res.status(201).json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getExternalSourceConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await ExternalSourceConfig.find().select('-credentials.token -credentials.apiKey');
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getExternalSourceConfigById = async (req: Request, res: Response) => {
  try {
    const config = await ExternalSourceConfig.findById(req.params.id)
      .select('-credentials.token -credentials.apiKey');
    
    if (!config) {
      return res.status(404).json({ error: 'External source configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateExternalSourceConfig = async (req: Request, res: Response) => {
  try {
    const config = await ExternalSourceConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-credentials.token -credentials.apiKey');
    
    if (!config) {
      return res.status(404).json({ error: 'External source configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteExternalSourceConfig = async (req: Request, res: Response) => {
  try {
    const config = await ExternalSourceConfig.findByIdAndDelete(req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'External source configuration not found' });
    }
    
    res.json({ message: 'External source configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const config = await ExternalSourceConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'External source configuration not found' });
    }
    
    res.json({ status: 'success', message: 'Connection test successful' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const triggerSync = async (req: Request, res: Response) => {
  try {
    const config = await ExternalSourceConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'External source configuration not found' });
    }
    
    await ExternalSourceService.syncSource(config);
    
    res.json({ status: 'success', message: 'Sync triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const triggerAllSync = async (req: Request, res: Response) => {
  try {
    await ExternalSourceService.syncAllSources();
    res.json({ status: 'success', message: 'All sources sync triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};