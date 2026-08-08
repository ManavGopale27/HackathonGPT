import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = "AQ.Ab8RN6KRyS3pyN_v7fxE7Q5r614g8YxG49U2IvvK9rxWnCKspA";
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      geminiConfigured: hasKey,
      timestamp: new Date().toISOString(),
    });
  });

  // PDF Text Extraction Endpoint
  app.post('/api/upload-pdf', async (req, res) => {
    try {
      const { base64Data, filename } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'No base64Data provided' });
      }

      const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
      const parsed = await pdfParse(buffer);

      const cleanText = parsed.text
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 12000); // Limit text length for prompt context

      res.json({
        success: true,
        filename: filename || 'uploaded_rulebook.pdf',
        pages: parsed.numpages,
        extracted_text: cleanText,
        char_count: cleanText.length,
      });
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      res.status(500).json({
        error: 'Failed to parse PDF document',
        details: err?.message || String(err),
      });
    }
  });

  // Team Orchestration API via Gemini 3.6 Flash
  app.post('/api/orchestrate', async (req, res) => {
    try {
      const { team_size, duration_hours, members, problem_statement, pdf_context } = req.body;

      if (!problem_statement) {
        return res.status(400).json({ error: 'Problem statement is required' });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback response if Gemini API key is missing
        console.warn('GEMINI_API_KEY not configured. Returning rule-based fallback response.');
        return res.json({
          team_name: 'Hackathon Squad (Offline Mode)',
          architecture_summary: `Full-stack implementation strategy for: "${problem_statement.slice(0, 80)}...". Express API Gateway handling Gemini orchestration and React UI rendering dark IDE theme.`,
          recommended_stack: [
            'React 19 + TypeScript',
            'Tailwind CSS v4 Dark IDE',
            'Node.js Express Server',
            'Gemini 3.6 Flash SDK',
          ],
          judging_focus: [
            'Core Functionality (35%)',
            'AI Innovation (30%)',
            'UI/UX Design (20%)',
            'Timeframe Feasibility (15%)',
          ],
          timeline_milestones: [
            {
              timeframe: `Hours 00 - ${Math.floor(duration_hours * 0.2)}`,
              title: 'System Setup & Schema',
              goals: ['Define API contracts', 'Setup repository'],
              deliverables: ['Scaffold endpoints', 'UI Shell'],
            },
            {
              timeframe: `Hours ${Math.floor(duration_hours * 0.2)} - ${Math.floor(duration_hours * 0.6)}`,
              title: 'Core Development',
              goals: ['Build core features', 'Integrate AI services'],
              deliverables: ['Working AI Pipeline', 'Main Canvas View'],
            },
            {
              timeframe: `Hours ${Math.floor(duration_hours * 0.6)} - ${duration_hours}`,
              title: 'Testing & Polish',
              goals: ['UI refinements', 'Demo preparation'],
              deliverables: ['Polished App', 'Pitch Deck'],
            },
          ],
          team_assignments: (members || []).map((m: any, idx: number) => ({
            member_id: m.id || `m-${idx + 1}`,
            member_index: idx + 1,
            name: m.name || `Member ${idx + 1}`,
            assigned_title: idx === 0 ? 'Lead Frontend Engineer' : idx === 1 ? 'Backend API Specialist' : 'AI Systems Specialist',
            skills: m.skills || ['TypeScript'],
            key_deliverables: [
              `Implement primary feature for ${m.name || 'Member ' + (idx + 1)}`,
              `Connect module to central API pipeline`,
              `Write test cases and documentation`,
            ],
            custom_tech_stack: (m.skills || []).slice(0, 4),
          })),
        });
      }

      const prompt = `
You are Hackathon GPT, a Senior Full-Stack CTO & Hackathon Systems Architect.
Analyze the following Hackathon Problem Statement and Team Matrix, and generate a deep, ChatGPT-style Hackathon Execution Guide in Markdown.

HACKATHON DURATION: ${duration_hours || 24} hours
TEAM SIZE: ${team_size || 3} members

TEAM MEMBERS & SKILLS:
${JSON.stringify(members, null, 2)}

HACKATHON PROBLEM STATEMENT:
"${problem_statement}"

${pdf_context ? `ATTACHED RULEBOOK / PDF CONTEXT:\n"${pdf_context.slice(0, 3000)}"` : ''}

INSTRUCTIONS:
1. Provide a high-impact Team Name in "team_name".
2. Include a full, long-form, Markdown-formatted report in "markdown_report" structured EXACTLY with these sections:

# [Project Name] - System Architecture & Hackathon Execution Plan

## Section 1: System Architecture & Modular API Blueprint
- Detailed system design, data flow, API route specifications, and component architecture.
- Recommended Tech Stack and Repository Directory Structure (in code blocks).

## Section 2: Hour-by-Hour Execution Timetable (0 to ${duration_hours || 24}h Deadline)
- Detailed hour-by-hour or phased milestone breakdown from Hour 0 to Deadline.

## Section 3: Strategic Execution Rules (What TO DO vs. What NOT TO DO)
- Winning strategies, best practices, and critical traps/pitfalls to avoid.

## Section 4: Member-by-Member Task Allocation
- Precise role titles, technical stack, and clear key deliverables for EACH of the ${members.length} team members.

3. Provide member assignments in "team_assignments" for each of the ${members.length} members with member_id, name, assigned_title, skills, key_deliverables, custom_tech_stack.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert CTO organizing a winning hackathon team. Respond strictly in JSON format matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              team_name: { type: Type.STRING },
              markdown_report: { type: Type.STRING },
              team_assignments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    member_id: { type: Type.STRING },
                    member_index: { type: Type.INTEGER },
                    name: { type: Type.STRING },
                    assigned_title: { type: Type.STRING },
                    skills: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    key_deliverables: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    custom_tech_stack: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    'member_id',
                    'member_index',
                    'name',
                    'assigned_title',
                    'skills',
                    'key_deliverables',
                    'custom_tech_stack',
                  ],
                },
              },
            },
            required: ['team_name', 'markdown_report', 'team_assignments'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      // Ensure member IDs match request
      if (parsedData.team_assignments && Array.isArray(parsedData.team_assignments)) {
        parsedData.team_assignments = parsedData.team_assignments.map(
          (assignment: any, idx: number) => ({
            ...assignment,
            member_id: members[idx]?.id || assignment.member_id || `m-${idx + 1}`,
            member_index: idx + 1,
            name: members[idx]?.name || assignment.name,
          })
        );
      }

      // If markdown_report wasn't generated by Gemini, synthesize a clean long-form report
      if (!parsedData.markdown_report) {
        parsedData.markdown_report = `# 🚀 HACKATHON BLUEPRINT & SYSTEM ARCHITECTURE
**Squad Name:** ${parsedData.team_name || 'Hackathon Squad'}
**Duration:** ${duration_hours || 24} Hours | **Target:** Winning Full-Stack MVP

---

## 1. System Architecture & Modular API Blueprint

${parsedData.architecture_summary || 'Event-driven React + Express architecture.'}

### Recommended Tech Stack:
${(parsedData.recommended_stack || []).map((s: string) => `- **${s}**`).join('\n')}

---

## 2. Complete Repository Directory Structure & File Hierarchy

\`\`\`
/
├── package.json               # Node.js dependencies & scripts
├── server.ts                  # Express server & Gemini API endpoints
├── src/
│   ├── main.tsx               # React 19 root
│   ├── App.tsx                # Master state & pill bar navigation
│   ├── types.ts               # Shared TypeScript models
│   └── components/
│       ├── SidebarShutter.tsx # Left squad shutter panel
│       ├── MemberPillBar.tsx  # Top member tabs
│       ├── MainCanvas.tsx     # ChatGPT-style prose execution document
│       ├── SubmitBar.tsx      # Bottom floating prompt bar
│       └── SubChatbotModal.tsx# Member co-pilot sub-chatbot
\`\`\`

---

## 3. Hour-by-Hour Hackathon Execution Timetable

${(parsedData.timeline_milestones || [])
  .map(
    (m: any) => `### ⏱️ ${m.timeframe}: ${m.title}
- **Goals:** ${(m.goals || []).join(', ')}
- **Deliverables:** ${(m.deliverables || []).join(', ')}
`
  )
  .join('\n')}

---

## 4. Strategic Execution Rules: TO DO vs. NOT TO DO

### ✅ WINNING STRATEGIES (WHAT TO DO):
- **Focus on One Clean End-to-End Flow:** Build a zero-placeholder complete user path.
- **Utilize Sub-Agent Co-Pilots:** Leverage each member's specialized sub-chatbot for rapid code generation.
- **Maintain High Density Dark IDE UI:** Polished dark mode with clear typography and no visual noise.

### ❌ CRITICAL TRAPS (WHAT NOT TO DO):
- **DO NOT** spend time on complex unrequested authentication or multi-tenant user roles.
- **DO NOT** hardcode secrets or API keys in browser client code.

---

## 5. Hackathon Judging Criteria Alignment & Pitch Strategy

${(parsedData.judging_focus || []).map((j: string) => `- **${j}**`).join('\n')}

---

## 6. Member-by-Member Role Allocation & Task Assignments

${(parsedData.team_assignments || [])
  .map(
    (a: any) => `### 👤 Member ${a.member_index}: ${a.name} (${a.assigned_title})
- **Tech Stack:** ${(a.custom_tech_stack || []).join(', ')}
- **Assigned Deliverables:**
${(a.key_deliverables || []).map((d: string) => `  * ${d}`).join('\n')}
`
  )
  .join('\n')}`;
      }

      res.json(parsedData);
    } catch (err: any) {
      console.error('Orchestration endpoint error:', err);
      res.status(500).json({
        error: 'Failed to process team orchestration',
        details: err?.message || String(err),
      });
    }
  });

  // Member Sub-Chatbot endpoint
  app.post('/api/chat/sub-chatbot', async (req, res) => {
    try {
      const {
        member_name,
        assigned_title,
        skills,
        duration_hours,
        user_query,
        problem_statement,
        architecture_summary,
        key_deliverables,
        chat_history,
      } = req.body;

      if (!user_query) {
        return res.status(400).json({ error: 'user_query is required' });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback response if Gemini API key missing
        return res.json({
          reply: `[Offline Mode AI Co-Pilot for ${member_name || 'Member'}]
I've received your query: "${user_query}".
Since GEMINI_API_KEY is not set yet, here is a recommended execution step for your deliverable (${(key_deliverables || [])[0] || 'assigned task'}):
1. Create a dedicated module file in \`/src/components/\` or \`/server/\`.
2. Use standard TypeScript interfaces and exports.
3. Add key logs and event handlers to verify execution.`,
          code_blocks: [
            {
              language: 'typescript',
              code: `// Boilerplate starter for ${assigned_title || 'Module'}
export async function executeModuleTask() {
  console.log("Executing deliverable for ${member_name || 'Member'}...");
  return { status: "success", timestamp: Date.now() };
}`,
            },
          ],
        });
      }

      const systemPrompt = `
You are the dedicated AI Co-Pilot for ${member_name} (${assigned_title}).
You reside inside ${member_name}'s private workspace inside Hackathon GPT.

MEMBER CONTEXT:
- Name: ${member_name}
- Role/Title: ${assigned_title}
- Focus Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
- Hackathon Time Remaining: ${duration_hours || 24} hours
- Assigned Deliverables:
${Array.isArray(key_deliverables) ? key_deliverables.map((d: string) => `  * ${d}`).join('\n') : key_deliverables}

PROJECT CONTEXT:
- Problem Statement: "${problem_statement || 'Hackathon Project'}"
- Overall Architecture: "${architecture_summary || 'Full-stack application'}"

YOUR ROLE & DIRECTIVES:
1. Provide concise, step-by-step guidance strictly tailored to ${member_name}'s assigned deliverables.
2. Provide actual runnable code snippets, terminal commands, or configuration files whenever requested.
3. Be an energetic, highly efficient coding partner. Keep answers direct and technical.
`;

      const contentsPrompt = `
Chat History Context:
${(chat_history || [])
  .slice(-6)
  .map((m: any) => `${m.sender.toUpperCase()}: ${m.content}`)
  .join('\n')}

USER QUERY:
${user_query}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const replyText = response.text || 'I analyzed your request. Let me know if you need code generation for this deliverable.';

      res.json({
        reply: replyText,
      });
    } catch (err: any) {
      console.error('Sub-chatbot endpoint error:', err);
      res.status(500).json({
        error: 'Sub-chatbot processing error',
        details: err?.message || String(err),
      });
    }
  });

  // Vite Middleware in Development Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hackathon GPT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
