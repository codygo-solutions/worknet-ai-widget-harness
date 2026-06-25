import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;
// The secret token Worknet must provide
const AUTH_TOKEN = 'Bearer codygo-qa-token-123'; 
const app = express();

app.use(cors());
app.use(express.json());

// Log all inbound traffic and show the header
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} — Auth Header: "${req.headers['authorization'] ?? 'None'}"`);
  next();
});

// ─── AUTHENTICATION GATE ──────────────────────────────────────────────────
app.use('/mcp', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== AUTH_TOKEN) {
    console.warn(`[AUTH FAILED] Connection rejected. Invalid or missing Bearer token.`);
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
  
  console.log(`[AUTH SUCCESS] Token verified.`);
  next();
});

// ─── 1. Tool Discovery ───────────────────────────────────────────────────
app.post('/mcp', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: "2.0", id: id,
      result: {
        tools: [
          {
            name: "calculate_server_load",
            description: "Calculates a mock server load percentage based on the number of active instances.",
            inputSchema: {
              type: "object",
              properties: { instances: { type: "number", description: "Number of active instances" } },
              required: ["instances"]
            }
          },
          {
            name: "fetch_error_logs",
            description: "Retrieves recent error logs for a specific service.",
            inputSchema: {
              type: "object",
              properties: {
                service_name: { type: "string", description: "Name of the service (e.g., 'auth-db', 'payment-gateway')" },
                severity: { type: "string", enum: ["warn", "error", "critical"], description: "The severity level of the logs" }
              },
              required: ["service_name", "severity"]
            }
          },
          {
            name: "restart_container",
            description: "Simulates restarting a docker container.",
            inputSchema: {
              type: "object",
              properties: { container_id: { type: "string", description: "The ID of the container to restart" } },
              required: ["container_id"]
            }
          }
        ]
      }
    });
  }

  // ─── 2. Tool Execution ───────────────────────────────────────────────────
  if (method === 'tools/call') {
    const toolName = params.name;
    const args = params.arguments || {};
    
    console.log(`[TOOL TRIGGERED] ${toolName} with args:`, args);
    let resultText = "";

    if (toolName === 'calculate_server_load') {
      const instances = args.instances;
      const baseLoad = 100 / instances;
      const load = Math.min(100, Math.max(0, baseLoad + (Math.random() * 5))).toFixed(1);
      resultText = `Mock load across ${instances} instance(s): ${load}%`;
    } else if (toolName === 'fetch_error_logs') {
      resultText = `Found 3 [${args.severity.toUpperCase()}] logs for service '${args.service_name}'.`;
    } else if (toolName === 'restart_container') {
      resultText = `SUCCESS: Container '${args.container_id}' has been gracefully restarted.`;
    } else {
      return res.json({ jsonrpc: "2.0", id: id, error: { code: -32601, message: `Tool not found: ${toolName}` } });
    }

    console.log(`[TOOL RESULT] ${resultText}`);
    return res.json({ jsonrpc: "2.0", id: id, result: { content: [{ type: "text", text: resultText }] } });
  }

  return res.status(404).json({ jsonrpc: "2.0", id: id, error: { code: -32601, message: `Method not found: ${method}` } });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── REST API LOGGER ──────────────────────────────────────────────────────────
// Scoped only to /api/* routes — does not affect /mcp logging above.

app.use('/api', (req, _res, next) => {
  console.log(`\n[REST API HIT]`);
  console.log(`  Method : ${req.method}`);
  console.log(`  Path   : ${req.path}`);
  console.log(`  Query  : ${JSON.stringify(req.query)}`);
  console.log(`  Body   : ${JSON.stringify(req.body)}`);
  next();
});

// ─── GET /api/users ───────────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
  const { role } = req.query;

  const allUsers = [
    { id: 1, name: 'Alice Nguyen',  role: 'admin'   },
    { id: 2, name: 'Bob Carter',    role: 'engineer' },
    { id: 3, name: 'Carol Smith',   role: 'engineer' },
    { id: 4, name: 'David Lee',     role: 'viewer'   },
    { id: 5, name: 'Eva Rossi',     role: 'admin'    },
  ];

  const users = role
    ? allUsers.filter(u => u.role === role)
    : allUsers;

  console.log(`[REST RESULT] Returning ${users.length} user(s) (role filter: "${role ?? 'none'}")`);
  return res.json({ users, total: users.length });
});

// ─── POST /api/tickets ────────────────────────────────────────────────────────

app.post('/api/tickets', (req, res) => {
  const { title, priority } = req.body ?? {};

  if (!title || !priority) {
    console.warn('[REST RESULT] 400 — missing "title" or "priority" in body');
    return res.status(400).json({ error: 'Both "title" and "priority" are required.' });
  }

  const ticket = {
    id:        `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    title,
    priority,
    status:    'open',
    createdAt: new Date().toISOString(),
  };

  console.log(`[REST RESULT] Created ticket ${ticket.id} — "${title}" [${priority}]`);
  return res.status(201).json({ ticket });
});

// ─── GET /openapi.json ────────────────────────────────────────────────────────

app.get('/openapi.json', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Codygo QA Mock API',
      version: '1.0.0',
    },
    paths: {
      '/api/users': {
        get: {
          operationId: 'get_users',
          summary: 'List users, optionally filtered by role',
          parameters: [
            {
              name: 'role',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Filter users by role (e.g. admin, engineer, viewer)',
            },
          ],
          responses: {
            '200': {
              description: 'A list of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: { type: 'array', items: { type: 'object' } },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tickets': {
        post: {
          operationId: 'create_ticket',
          summary: 'Create a new support ticket',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'priority'],
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Short description of the issue',
                    },
                    priority: {
                      type: 'string',
                      enum: ['low', 'normal', 'high'],
                      description: 'Urgency level of the ticket',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Ticket created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ticket: { type: 'object' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Missing required fields',
            },
          },
        },
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n🔒 Mock Server running on http://localhost:${PORT}`);
  console.log(`   MCP endpoint   : POST http://localhost:${PORT}/mcp`);
  console.log(`   REST users     : GET  http://localhost:${PORT}/api/users?role=admin`);
  console.log(`   REST tickets   : POST http://localhost:${PORT}/api/tickets`);
  console.log(`   Health check   : GET  http://localhost:${PORT}/health`);
  console.log(`   OpenAPI spec   : GET  http://localhost:${PORT}/openapi.json\n`);
});