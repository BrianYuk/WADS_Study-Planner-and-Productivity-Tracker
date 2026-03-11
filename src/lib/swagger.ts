export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Kira Flow API',
    version: '1.0.0',
    description: 'API documentation for Kira Flow — AI-Powered Study Companion. All protected routes require a valid `access_token` cookie set at login.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
  tags: [
    { name: 'Authentication', description: 'Register, login, and logout' },
    { name: 'Tasks', description: 'Create and manage study tasks' },
    { name: 'Sessions', description: 'Log and track study sessions' },
    { name: 'Goals', description: 'Set and track study goals' },
    { name: 'Notifications', description: 'View and manage notifications' },
    { name: 'Analytics', description: 'Dashboard analytics and insights' },
    { name: 'AI', description: 'AI-powered prioritization and burnout detection' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Unauthorized' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Brian Santoso' },
          email: { type: 'string', example: 'brian@binus.ac.id' },
          role: { type: 'string', example: 'STUDENT' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', example: 'Data Structures Assignment' },
          subject: { type: 'string', example: 'COMP6047' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          dueDate: { type: 'string', format: 'date-time' },
          estimatedMins: { type: 'integer', example: 120 },
          aiPriority: { type: 'number', example: 0.87 },
          tags: { type: 'array', items: { type: 'string' } },
          subtasks: { type: 'array', items: { type: 'object' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      StudySession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['POMODORO', 'DEEP_WORK', 'REVIEW', 'PRACTICE', 'READING'] },
          subject: { type: 'string', example: 'COMP6047' },
          startTime: { type: 'string', format: 'date-time' },
          durationMins: { type: 'integer', example: 25 },
          focusScore: { type: 'integer', example: 85 },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Goal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', example: 'Study 20 hours this week' },
          type: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER'] },
          targetValue: { type: 'number', example: 20 },
          currentValue: { type: 'number', example: 8.5 },
          unit: { type: 'string', example: 'hours' },
          status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED'] },
          targetDate: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', example: 'TASK_DUE' },
          title: { type: 'string', example: 'Task Due Soon' },
          message: { type: 'string', example: 'Data Structures due in 2 hours' },
          isRead: { type: 'boolean' },
          sentAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    // ── AUTH ──
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Brian Santoso' },
                  email: { type: 'string', example: 'brian@binus.ac.id' },
                  password: { type: 'string', example: 'SecurePass123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, message: { type: 'string' } } } } } },
          400: { description: 'Invalid input or weak password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Too many registration attempts', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'brian@binus.ac.id' },
                  password: { type: 'string', example: 'SecurePass123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, message: { type: 'string' } } } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Too many login attempts', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and clear session cookies',
        responses: {
          200: { description: 'Logged out successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Logged out successfully' } } } } } },
        },
      },
    },

    // ── TASKS ──
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List all tasks with optional filters',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } },
          { name: 'subject', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Paginated task list', content: { 'application/json': { schema: { type: 'object', properties: { tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } }, pagination: { type: 'object' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Lab Report' },
                  description: { type: 'string' },
                  subject: { type: 'string', example: 'COMP6047' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
                  dueDate: { type: 'string', format: 'date-time' },
                  estimatedMins: { type: 'integer', example: 120 },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created', content: { 'application/json': { schema: { type: 'object', properties: { task: { $ref: '#/components/schemas/Task' } } } } } },
          400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get a single task by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task found', content: { 'application/json': { schema: { type: 'object', properties: { task: { $ref: '#/components/schemas/Task' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                  estimatedMins: { type: 'integer' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Task updated', content: { 'application/json': { schema: { type: 'object', properties: { task: { $ref: '#/components/schemas/Task' }, message: { type: 'string' } } } } } },
          400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task deleted', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Task deleted successfully' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── SESSIONS ──
    '/api/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'List study sessions (filterable by date range)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: { description: 'Sessions list', content: { 'application/json': { schema: { type: 'object', properties: { sessions: { type: 'array', items: { $ref: '#/components/schemas/StudySession' } }, totalMins: { type: 'integer' }, count: { type: 'integer' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Sessions'],
        summary: 'Log a new study session',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['startTime'],
                properties: {
                  startTime: { type: 'string', format: 'date-time' },
                  type: { type: 'string', enum: ['POMODORO', 'DEEP_WORK', 'REVIEW', 'PRACTICE', 'READING'], default: 'POMODORO' },
                  durationMins: { type: 'integer', example: 25 },
                  focusScore: { type: 'integer', minimum: 1, maximum: 100, example: 85 },
                  subject: { type: 'string', example: 'COMP6047' },
                  taskId: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Session logged', content: { 'application/json': { schema: { type: 'object', properties: { session: { $ref: '#/components/schemas/StudySession' } } } } } },
          400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/sessions/{id}': {
      get: {
        tags: ['Sessions'],
        summary: 'Get a single session by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Session found', content: { 'application/json': { schema: { type: 'object', properties: { session: { $ref: '#/components/schemas/StudySession' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Sessions'],
        summary: 'Delete a study session',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Session deleted', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Session deleted successfully' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── GOALS ──
    '/api/goals': {
      get: {
        tags: ['Goals'],
        summary: 'List all goals',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Goals list', content: { 'application/json': { schema: { type: 'object', properties: { goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Goals'],
        summary: 'Create a new goal',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'targetValue', 'targetDate'],
                properties: {
                  title: { type: 'string', example: 'Study 20 hours this week' },
                  type: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER'], default: 'WEEKLY' },
                  targetValue: { type: 'number', example: 20 },
                  unit: { type: 'string', default: 'hours' },
                  targetDate: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Goal created', content: { 'application/json': { schema: { type: 'object', properties: { goal: { $ref: '#/components/schemas/Goal' } } } } } },
          400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/goals/{id}': {
      get: {
        tags: ['Goals'],
        summary: 'Get a single goal by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Goal found', content: { 'application/json': { schema: { type: 'object', properties: { goal: { $ref: '#/components/schemas/Goal' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Goal not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Goals'],
        summary: 'Update a goal',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  currentValue: { type: 'number', example: 15 },
                  targetValue: { type: 'number' },
                  status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED'] },
                  targetDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Goal updated', content: { 'application/json': { schema: { type: 'object', properties: { goal: { $ref: '#/components/schemas/Goal' }, message: { type: 'string' } } } } } },
          400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Goal not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Goals'],
        summary: 'Delete a goal',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Goal deleted', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Goal deleted successfully' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Goal not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── NOTIFICATIONS ──
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get all notifications (up to 50 most recent)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Notifications list', content: { 'application/json': { schema: { type: 'object', properties: { notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } }, unreadCount: { type: 'integer' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'All marked as read', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'All notifications marked as read' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── ANALYTICS ──
    '/api/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Full dashboard analytics (last 7 and 30 days)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tasks: { type: 'object', properties: { total: { type: 'integer' }, todo: { type: 'integer' }, inProgress: { type: 'integer' }, completed: { type: 'integer' }, cancelled: { type: 'integer' } } },
                    study: { type: 'object', properties: { totalMins7Days: { type: 'integer' }, sessionCount7Days: { type: 'integer' }, avgFocusScore: { type: 'integer' } } },
                    dailyData: { type: 'array', items: { type: 'object' } },
                    subjectBreakdown: { type: 'array', items: { type: 'object' } },
                    goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── AI ──
    '/api/ai/prioritize': {
      post: {
        tags: ['AI'],
        summary: 'AI task prioritization (uses authenticated user\'s active tasks)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'AI-ranked task list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: { type: 'array', items: { type: 'object', properties: { taskId: { type: 'string' }, aiScore: { type: 'number' }, reasoning: { type: 'string' }, suggestedOrder: { type: 'integer' } } } },
                    tasksAnalyzed: { type: 'integer' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'AI rate limit exceeded (20 req/hr)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/ai/burnout': {
      get: {
        tags: ['AI'],
        summary: 'AI burnout risk analysis based on 7-day study patterns',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Burnout risk analysis',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysis: {
                      type: 'object',
                      properties: {
                        riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        score: { type: 'integer', example: 42 },
                        insights: { type: 'array', items: { type: 'string' } },
                        recommendations: { type: 'array', items: { type: 'string' } },
                        scheduleAdjustments: { type: 'array', items: { type: 'string' } },
                      },
                    },
                    generatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limit exceeded (10 req/hr)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
}
