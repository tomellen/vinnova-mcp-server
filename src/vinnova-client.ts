import axios from 'axios';
import { VinnovaProject, SearchParams } from './types.js';

const BASE_URL = 'https://data.vinnova.se/api/projekt';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export class VinnovaClient {
  private cache: Map<string, { data: VinnovaProject[]; timestamp: number }> = new Map();

  async fetchProjects(startDate: string = '2001-01-01'): Promise<VinnovaProject[]> {
    const cacheKey = `projects_${startDate}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await axios.get<VinnovaProject[]>(`${BASE_URL}/${startDate}`, {
        timeout: 30000,
        maxContentLength: 100 * 1024 * 1024, // 100MB
      });

      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch Vinnova data: ${error.message}`);
      }
      throw error;
    }
  }

  async searchProjects(params: SearchParams): Promise<VinnovaProject[]> {
    // Use a more recent start date if not specified to reduce data load
    // If user asks for specific year, use that year as start date
    let startDate = params.startDate || '2001-01-01';

    // If endDate is specified and no startDate, use a reasonable default (5 years before endDate)
    if (params.endDate && !params.startDate) {
      const endYear = parseInt(params.endDate.substring(0, 4));
      const startYear = Math.max(2001, endYear - 5);
      startDate = `${startYear}-01-01`;
    }

    const allProjects = await this.fetchProjects(startDate);

    let filtered = allProjects;

    if (params.endDate) {
      filtered = filtered.filter(p => {
        if (!p.projektStart) return false;
        return p.projektStart <= params.endDate!;
      });
    }

    if (params.organization) {
      const orgLower = params.organization.toLowerCase();
      filtered = filtered.filter(p =>
        p.organisationNamn?.toLowerCase().includes(orgLower)
      );
    }

    if (params.keyword) {
      const keywordLower = params.keyword.toLowerCase();
      filtered = filtered.filter(p =>
        p.projektTitel?.toLowerCase().includes(keywordLower) ||
        p.sammanfattning?.toLowerCase().includes(keywordLower) ||
        p.utlysningNamn?.toLowerCase().includes(keywordLower)
      );
    }

    if (params.kommun) {
      const kommunLower = params.kommun.toLowerCase();
      filtered = filtered.filter(p =>
        p.organisationKommun?.toLowerCase().includes(kommunLower)
      );
    }

    if (params.lan) {
      const lanLower = params.lan.toLowerCase();
      filtered = filtered.filter(p =>
        p.organisationLan?.toLowerCase().includes(lanLower)
      );
    }

    if (params.minAmount !== undefined) {
      filtered = filtered.filter(p =>
        p.beviljatBidrag !== undefined && p.beviljatBidrag >= params.minAmount!
      );
    }

    if (params.maxAmount !== undefined) {
      filtered = filtered.filter(p =>
        p.beviljatBidrag !== undefined && p.beviljatBidrag <= params.maxAmount!
      );
    }

    if (params.limit) {
      filtered = filtered.slice(0, params.limit);
    }

    return filtered;
  }

  async getProjectById(projectId: string): Promise<VinnovaProject | null> {
    const allProjects = await this.fetchProjects();
    return allProjects.find(p => p.projektID === projectId) || null;
  }

  async getProjectsByOrganization(organizationName: string, limit?: number): Promise<VinnovaProject[]> {
    const projects = await this.searchProjects({
      organization: organizationName,
      limit,
    });
    return projects;
  }

  async getStatistics(startDate?: string): Promise<{
    totalProjects: number;
    totalFunding: number;
    averageFunding: number;
    topOrganizations: Array<{ name: string; count: number; totalFunding: number }>;
    projectsByYear: Array<{ year: number; count: number; totalFunding: number }>;
  }> {
    const projects = await this.fetchProjects(startDate);

    const totalFunding = projects.reduce((sum, p) => sum + (p.beviljatBidrag || 0), 0);
    const projectsWithFunding = projects.filter(p => p.beviljatBidrag);
    const averageFunding = projectsWithFunding.length > 0
      ? totalFunding / projectsWithFunding.length
      : 0;

    const orgStats = new Map<string, { count: number; totalFunding: number }>();
    projects.forEach(p => {
      if (p.organisationNamn) {
        const existing = orgStats.get(p.organisationNamn) || { count: 0, totalFunding: 0 };
        existing.count++;
        existing.totalFunding += p.beviljatBidrag || 0;
        orgStats.set(p.organisationNamn, existing);
      }
    });

    const topOrganizations = Array.from(orgStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalFunding - a.totalFunding)
      .slice(0, 10);

    const yearStats = new Map<number, { count: number; totalFunding: number }>();
    projects.forEach(p => {
      if (p.beviljandeAr) {
        const existing = yearStats.get(p.beviljandeAr) || { count: 0, totalFunding: 0 };
        existing.count++;
        existing.totalFunding += p.beviljatBidrag || 0;
        yearStats.set(p.beviljandeAr, existing);
      }
    });

    const projectsByYear = Array.from(yearStats.entries())
      .map(([year, stats]) => ({ year, ...stats }))
      .sort((a, b) => a.year - b.year);

    return {
      totalProjects: projects.length,
      totalFunding,
      averageFunding,
      topOrganizations,
      projectsByYear,
    };
  }
}
