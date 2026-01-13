#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { VinnovaClient } from './vinnova-client.js';

const client = new VinnovaClient();

const server = new Server(
  {
    name: 'vinnova-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'search_vinnova_projects',
    description: 'Search for Vinnova-funded projects with optional filters. You can search by organization name, keywords in title/summary, date range, funding amount, municipality (kommun), and county (län). IMPORTANT: For year-specific searches (e.g., "projects from 2023"), you MUST set both startDate and endDate to limit the data fetch (e.g., startDate: "2023-01-01", endDate: "2023-12-31"). Returns matching projects with details like title, organization, funding amount, and project period.',
    inputSchema: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Filter by organization name (partial match)',
        },
        keyword: {
          type: 'string',
          description: 'Search keyword in project title, summary, or call name',
        },
        startDate: {
          type: 'string',
          description: 'Filter projects starting from this date (YYYY-MM-DD). For specific year searches, set this to limit API data fetch.',
        },
        endDate: {
          type: 'string',
          description: 'Filter projects up to this date (YYYY-MM-DD). For specific year searches, set this to limit the results.',
        },
        kommun: {
          type: 'string',
          description: 'Filter by municipality/kommun (partial match, e.g., "Malmö", "Lund")',
        },
        lan: {
          type: 'string',
          description: 'Filter by county/län (partial match, e.g., "Skåne", "Stockholm")',
        },
        minAmount: {
          type: 'number',
          description: 'Minimum funding amount in SEK',
        },
        maxAmount: {
          type: 'number',
          description: 'Maximum funding amount in SEK',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
          default: 50,
        },
      },
    },
  },
  {
    name: 'get_vinnova_project',
    description: 'Get detailed information about a specific Vinnova project by its project ID. Returns complete project details including title, organization, funding, dates, summary, and call information.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_organization_projects',
    description: 'Get all Vinnova projects for a specific organization. Returns a list of projects with funding details and totals. Useful for analyzing an organization\'s funding history.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationName: {
          type: 'string',
          description: 'The name of the organization (partial match)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
        },
      },
      required: ['organizationName'],
    },
  },
  {
    name: 'get_vinnova_statistics',
    description: 'Get aggregated statistics about Vinnova funding. Returns total projects, total funding, average funding, top organizations by funding, and project distribution by year. Useful for understanding overall trends and major recipients.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Calculate statistics from this date (YYYY-MM-DD). Default: 2001-01-01',
        },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error('Missing arguments');
    }

    switch (name) {
      case 'search_vinnova_projects': {
        const results = await client.searchProjects({
          organization: args.organization as string | undefined,
          keyword: args.keyword as string | undefined,
          startDate: args.startDate as string | undefined,
          endDate: args.endDate as string | undefined,
          kommun: args.kommun as string | undefined,
          lan: args.lan as string | undefined,
          minAmount: args.minAmount as number | undefined,
          maxAmount: args.maxAmount as number | undefined,
          limit: (args.limit as number | undefined) || 50,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_vinnova_project': {
        const projectId = args.projectId as string;
        const project = await client.getProjectById(projectId);

        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Project not found' }),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2),
            },
          ],
        };
      }

      case 'get_organization_projects': {
        const organizationName = args.organizationName as string;
        const limit = args.limit as number | undefined;
        const projects = await client.getProjectsByOrganization(organizationName, limit);

        const totalFunding = projects.reduce((sum, p) => sum + (p.beviljatBidrag || 0), 0);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                organization: organizationName,
                totalProjects: projects.length,
                totalFunding,
                projects,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_vinnova_statistics': {
        const startDate = args.startDate as string | undefined;
        const stats = await client.getStatistics(startDate);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vinnova MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
