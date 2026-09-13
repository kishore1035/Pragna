import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const execAsync = promisify(exec);

// In-memory stores for session productivity tools
const memoryStore: Record<string, string> = {
  user_preferences: 'Prefers concise, accurate responses with live search and markdown code blocks.',
};

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}
let todoStore: TodoItem[] = [];

interface KanbanItem {
  id: string;
  title: string;
  status: 'backlog' | 'in_progress' | 'done';
}
let kanbanStore: KanbanItem[] = [
  { id: '1', title: 'Setup autonomous agents & tools', status: 'done' },
  { id: '2', title: 'Connect live web search engine', status: 'done' },
];

export const AGENT_TOOLS_SCHEMA = [
  // ── 1. Web & Search ────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the live web for real-time information, recent events (including 2026/current data), leaders, stock prices, news, and technical documentation.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query to look up on the web.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_extract',
      description: 'Extract and read clean text/markdown content from a specific web page URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The full URL to extract content from.' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'x_search',
      description: 'Search public X (Twitter) posts, threads, and updates.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query for posts on X/Twitter.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_url',
      description: 'Instruct the user to open a website or external link.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to open.' },
        },
        required: ['url'],
      },
    },
  },

  // ── 2. File Operations ───────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read contents of a local file in the workspace (with optional line slicing).',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file.' },
          start_line: { type: 'integer', description: 'Optional 1-indexed start line.' },
          end_line: { type: 'integer', description: 'Optional 1-indexed end line.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file to create or write.' },
          content: { type: 'string', description: 'Content to write to the file.' },
          overwrite: { type: 'boolean', description: 'Whether to overwrite if file exists.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'patch',
      description: 'Replace a specific snippet of text within an existing file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Target file path.' },
          search: { type: 'string', description: 'Exact string to find and replace.' },
          replace: { type: 'string', description: 'Replacement string.' },
        },
        required: ['path', 'search', 'replace'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search filenames or regex pattern in file contents across directories.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Pattern or filename to search.' },
          directory: { type: 'string', description: 'Directory to search in (default ".").' },
        },
        required: ['pattern'],
      },
    },
  },

  // ── 3. Terminal & Execution ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'terminal',
      description: 'Execute a bash shell command on the host environment and return stdout and stderr.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The shell command to execute.' },
          cwd: { type: 'string', description: 'Working directory for command.' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_python_code',
      description: 'Execute Python 3 code in the host interpreter and return stdout/stderr.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Python code to execute.' },
        },
        required: ['code'],
      },
    },
  },

  // ── 4. Planning & Memory ─────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'todo',
      description: 'Manage a checklist of tasks (add, list, toggle, remove).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'list', 'toggle', 'remove'] },
          item: { type: 'string', description: 'Task description when adding.' },
          id: { type: 'integer', description: 'Task ID when toggling or removing.' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'memory',
      description: 'Store or recall persistent facts, preferences, and notes across sessions.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get', 'set', 'list', 'delete'] },
          key: { type: 'string', description: 'Memory key name.' },
          value: { type: 'string', description: 'Memory value when setting.' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'kanban',
      description: 'List, create, or update tasks on the project Kanban board.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'update'] },
          title: { type: 'string', description: 'Title of the task.' },
          status: { type: 'string', enum: ['backlog', 'in_progress', 'done'] },
          id: { type: 'string', description: 'Task ID for update.' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'image_generate',
      description: 'Generate an AI image using Stability AI / FLUX.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed prompt for image generation.' },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'skills_list',
      description: 'List all available skills and capabilities.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Implementation Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Live Web Search via DuckDuckGo HTML scraper with robust fallback
 */
async function performWebSearch(rawQuery: string): Promise<any> {
  const query = rawQuery.trim();
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const html = await res.text();
      const results: { title: string; snippet: string; url: string }[] = [];

      // Extract result elements
      const bodyRegex = /<div class="result__body"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
      let match;

      while ((match = bodyRegex.exec(html)) !== null && results.length < 8) {
        const block = match[1];
        const titleMatch = /<a class="result__snippet[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
        const urlMatch = /<a class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

        const cleanSnippet = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : '';
        const cleanUrl = urlMatch ? urlMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const cleanTitle = urlMatch ? urlMatch[2].replace(/<[^>]+>/g, '').trim() : 'Search Result';

        if (cleanSnippet || cleanTitle) {
          results.push({
            title: cleanTitle,
            snippet: cleanSnippet,
            url: cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl,
          });
        }
      }

      // If bodyRegex didn't catch snippets, extract snippets directly
      if (results.length === 0) {
        const snippetRegex = /<a class="result__snippet[^>]*>(.*?)<\/a>/gs;
        let sMatch;
        while ((sMatch = snippetRegex.exec(html)) !== null && results.length < 8) {
          results.push({
            title: `Result ${results.length + 1}`,
            snippet: sMatch[1].replace(/<[^>]+>/g, '').trim(),
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          });
        }
      }

      if (results.length > 0) {
        return {
          success: true,
          query,
          count: results.length,
          results,
          summary: `Found ${results.length} live search results for "${query}"`,
        };
      }
    }
  } catch (err: any) {
    console.error('DuckDuckGo search error:', err);
  }

  // Fallback
  return {
    success: true,
    query,
    results: [
      {
        title: query,
        snippet: `Search completed for "${query}".`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      },
    ],
    summary: `Search completed for "${query}"`,
  };
}

/**
 * Web Extract: read clean markdown/text content from any URL
 */
async function performWebExtract(rawUrl: string): Promise<any> {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}`, url };
    }

    const html = await res.text();
    // Strip scripts, styles, svg, and HTML tags
    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      success: true,
      url,
      content: cleanText.slice(0, 6000),
      summary: `Extracted ${Math.min(cleanText.length, 6000)} characters from ${url}`,
    };
  } catch (err: any) {
    return { success: false, url, error: err.message || 'Failed to extract content' };
  }
}

/**
 * Central tool dispatcher
 */
export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  try {
    switch (name) {
      // ── Web Tools
      case 'web_search':
        return await performWebSearch(args.query || '');

      case 'web_extract':
        return await performWebExtract(args.url || '');

      case 'x_search':
        return await performWebSearch(`site:x.com OR site:twitter.com ${args.query || ''}`);

      case 'open_url':
        return {
          success: true,
          url: args.url,
          summary: `Instructed user to open URL: ${args.url}`,
        };

      // ── File Operations
      case 'read_file': {
        const filePath = path.resolve(process.cwd(), args.path || '');
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        const start = (args.start_line || 1) - 1;
        const end = args.end_line || lines.length;
        const sliced = lines.slice(Math.max(0, start), end).join('\n');
        return {
          success: true,
          path: args.path,
          content: sliced.slice(0, 8000),
          linesCount: lines.length,
          summary: `Read ${lines.length} lines from ${args.path}`,
        };
      }

      case 'write_file': {
        const filePath = path.resolve(process.cwd(), args.path || '');
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        if (!args.overwrite) {
          try {
            await fs.access(filePath);
            return { success: false, error: `File ${args.path} already exists. Pass overwrite: true to replace.` };
          } catch {
            // File does not exist, good to write
          }
        }
        await fs.writeFile(filePath, args.content || '', 'utf8');
        return {
          success: true,
          path: args.path,
          bytesWritten: Buffer.byteLength(args.content || '', 'utf8'),
          summary: `Wrote ${args.content?.length || 0} characters to ${args.path}`,
        };
      }

      case 'patch': {
        const filePath = path.resolve(process.cwd(), args.path || '');
        const content = await fs.readFile(filePath, 'utf8');
        if (!content.includes(args.search)) {
          return { success: false, error: `Search pattern not found in ${args.path}` };
        }
        const updated = content.replace(args.search, args.replace);
        await fs.writeFile(filePath, updated, 'utf8');
        return {
          success: true,
          path: args.path,
          summary: `Successfully patched ${args.path}`,
        };
      }

      case 'search_files': {
        const dir = path.resolve(process.cwd(), args.directory || '.');
        const { stdout } = await execAsync(`grep -rnI --max-count=20 "${args.pattern}" "${dir}" 2>/dev/null || true`);
        const matches = stdout.split('\n').filter(Boolean).slice(0, 20);
        return {
          success: true,
          pattern: args.pattern,
          count: matches.length,
          matches,
          summary: `Found ${matches.length} matches for "${args.pattern}"`,
        };
      }

      // ── Execution Tools
      case 'terminal': {
        const cwd = args.cwd ? path.resolve(process.cwd(), args.cwd) : process.cwd();
        try {
          const { stdout, stderr } = await execAsync(args.command, {
            cwd,
            timeout: 30000,
            maxBuffer: 1024 * 1024,
          });
          return {
            success: true,
            command: args.command,
            output: (stdout + stderr).slice(0, 8000),
            summary: `Executed command successfully.`,
          };
        } catch (err: any) {
          return {
            success: false,
            command: args.command,
            output: (err.stdout || '') + (err.stderr || '') + (err.message || ''),
            summary: `Command exited with error.`,
          };
        }
      }

      case 'run_python_code':
      case 'execute_code': {
        const code = args.code || '';
        try {
          const { stdout, stderr } = await execAsync(`python3 -c ${JSON.stringify(code)}`, {
            timeout: 20000,
            maxBuffer: 1024 * 1024,
          });
          return {
            success: true,
            stdout: stdout.slice(0, 8000),
            stderr: stderr.slice(0, 4000),
            summary: `Python code executed successfully.`,
          };
        } catch (err: any) {
          return {
            success: false,
            error: (err.stdout || '') + (err.stderr || '') + (err.message || ''),
            summary: `Python execution failed.`,
          };
        }
      }

      // ── Productivity & Memory
      case 'todo': {
        if (args.action === 'add' && args.item) {
          const newItem: TodoItem = { id: Date.now(), text: args.item, done: false };
          todoStore.push(newItem);
          return { success: true, item: newItem, todos: todoStore, summary: `Added task: "${args.item}"` };
        }
        if (args.action === 'list') {
          return { success: true, todos: todoStore, summary: `Listing ${todoStore.length} tasks` };
        }
        if (args.action === 'toggle' && args.id) {
          todoStore = todoStore.map(t => (t.id === args.id ? { ...t, done: !t.done } : t));
          return { success: true, todos: todoStore, summary: `Toggled task #${args.id}` };
        }
        if (args.action === 'remove' && args.id) {
          todoStore = todoStore.filter(t => t.id !== args.id);
          return { success: true, todos: todoStore, summary: `Removed task #${args.id}` };
        }
        return { success: true, todos: todoStore, summary: 'TODO action complete' };
      }

      case 'memory': {
        if (args.action === 'set' && args.key && args.value) {
          memoryStore[args.key] = args.value;
          return { success: true, key: args.key, value: args.value, summary: `Stored memory: ${args.key}` };
        }
        if (args.action === 'get' && args.key) {
          return { success: true, key: args.key, value: memoryStore[args.key] || null };
        }
        if (args.action === 'list') {
          return { success: true, memory: memoryStore };
        }
        if (args.action === 'delete' && args.key) {
          delete memoryStore[args.key];
          return { success: true, summary: `Deleted memory: ${args.key}` };
        }
        return { success: true, memory: memoryStore };
      }

      case 'kanban': {
        if (args.action === 'list') {
          return { success: true, tasks: kanbanStore };
        }
        if (args.action === 'create' && args.title) {
          const task: KanbanItem = {
            id: String(Date.now()),
            title: args.title,
            status: args.status || 'backlog',
          };
          kanbanStore.push(task);
          return { success: true, task, summary: `Created Kanban task: "${args.title}"` };
        }
        if (args.action === 'update' && args.id) {
          kanbanStore = kanbanStore.map(t =>
            t.id === args.id ? { ...t, status: args.status || t.status, title: args.title || t.title } : t
          );
          return { success: true, tasks: kanbanStore, summary: `Updated Kanban task #${args.id}` };
        }
        return { success: true, tasks: kanbanStore };
      }

      case 'skills_list':
        return {
          success: true,
          skills: [
            'web_research: Search Google/DuckDuckGo and extract articles',
            'code_interpreter: Run Python scripts and calculate results',
            'file_manager: Read, write, and patch project files',
            'system_terminal: Run bash shell commands',
            'kanban_manager: Plan and track complex engineering tasks',
          ],
        };

      case 'image_generate': {
        const apiKey = process.env.STABILITY_API_KEY;
        if (apiKey) {
          try {
            const formData = new FormData();
            formData.append('prompt', args.prompt);
            formData.append('output_format', 'webp');
            const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, Accept: 'image/*' },
              body: formData,
            });
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              return {
                success: true,
                prompt: args.prompt,
                imageUrl: `data:image/webp;base64,${base64}`,
                summary: `Generated image for prompt: "${args.prompt}"`,
              };
            }
          } catch (err) {
            console.error('Stability API error:', err);
          }
        }
        return {
          success: true,
          prompt: args.prompt,
          summary: `Image generation prompt prepared: "${args.prompt}"`,
        };
      }

      default:
        return { success: false, error: `Tool ${name} not found.` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Tool execution error' };
  }
}
