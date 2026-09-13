#!/usr/bin/env python3
"""
ARGUS CLI 👁️
Interactive Terminal Assistant for Argus (Mimir)
Color palette and visual branding matching the Argus Chatbot UI.
"""

import sys
import os
import json
import asyncio
import httpx

# ANSI Color Codes matching Argus Chatbot UI Palette
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Chatbot UI Colors: Rich Maroon (#800020), Warm Cream (#FBF9F1), Soft Crimson (#B4323C), Muted (#A0968C)
MAROON = "\033[38;2;128;0;32m"
CRIMSON = "\033[38;2;180;50;60m"
CREAM = "\033[38;2;240;235;225m"
WHITE = "\033[38;2;255;255;255m"
MUTED = "\033[38;2;160;150;140m"
GREEN = "\033[38;2;40;180;100m"
RED = "\033[38;2;220;60;60m"

API_BASE = os.getenv("ARGUS_API_BASE", "http://localhost:8000")

BANNER = f"""{MAROON}
         .─────────.
       .╱   █████   ╲.
      (   (   α   )   )
       ╲_____________╱
        ╱   │   │   ╲

          a r g u s
{RESET}
{CREAM}{BOLD}Autonomous AI Agent Platform & CLI{RESET}
{MUTED}Type {WHITE}/help{MUTED} for available commands or start chatting below.{RESET}
"""


class ArgusCLI:
    def __init__(self):
        self.api_base = API_BASE
        self.current_model = "gemma4:cloud"
        self.conversation_id = None
        self.auth_token = None
        self.running = True

    async def ensure_auth(self):
        """Automatically authenticate or register CLI user to get JWT token."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.api_base}/api/auth/login",
                    json={"email": "cli@argusapp.com", "password": "arguspassword123"},
                )
                if res.status_code == 200:
                    self.auth_token = res.json().get("access_token")
                    return

                reg_res = await client.post(
                    f"{self.api_base}/api/auth/register",
                    json={"email": "cli@argusapp.com", "password": "arguspassword123"},
                )
                if reg_res.status_code in (200, 201):
                    self.auth_token = reg_res.json().get("access_token")
        except Exception as e:
            print(f"{MUTED}(Auth init check: {e}){RESET}")

    def print_banner(self):
        print(BANNER)

    def print_help(self):
        print(f"\n{WHITE}{BOLD}AVAILABLE COMMANDS:{RESET}")
        print(f"  {MAROON}/model [name]{RESET}  - View or switch AI model (e.g. gemma4:cloud, gemma4:31b-cloud)")
        print(f"  {MAROON}/tools{RESET}         - List all enabled agent tools")
        print(f"  {MAROON}/skills{RESET}        - List available agent skills")
        print(f"  {MAROON}/kanban{RESET}        - View project task board")
        print(f"  {MAROON}/history{RESET}       - Show conversation list")
        print(f"  {MAROON}/new{RESET}           - Reset and start a new conversation session")
        print(f"  {MAROON}/exit{RESET}          - Exit Argus CLI\n")

    async def list_tools(self):
        cats = [
            ("🌐 Web & Search", [
                ("web_search",    "Search the web for real-time info, news, docs"),
                ("web_extract",   "Extract text/markdown from any URL"),
                ("x_search",      "Search public X (Twitter) posts & threads"),
                ("open_url",      "Open a URL in the user's own browser tab"),
            ]),
            ("🌐 Browser Automation", [
                ("browser_navigate",  "Navigate headless browser to a URL"),
                ("browser_snapshot",  "Accessibility + visual snapshot of page"),
                ("browser_click",     "Click elements by CSS selector or text"),
                ("browser_type",      "Type text into form fields and inputs"),
                ("browser_scroll",    "Scroll pages up, down, or to elements"),
                ("browser_back",      "Navigate backward in browser history"),
                ("browser_press",     "Send key presses (Enter, Tab, Escape…)"),
                ("browser_get_images","Extract image assets and URLs from page"),
                ("browser_screenshot","Take a screenshot of the current page"),
                ("browser_console",   "Access browser JS console logs/errors"),
                ("browser_dialog",    "Handle alert/prompt/confirm dialogs"),
                ("browser_exec",      "Run autonomous browser workflows [CONFIRM]"),
                ("browser_act",       "Low-level click/type sequence [CONFIRM]"),
            ]),
            ("📁 File Operations & Code Editing", [
                ("read_file",     "View contents of local text or code files"),
                ("write_file",    "Create or overwrite files [CONFIRM]"),
                ("patch",         "Apply fuzzy-matched diff edits [CONFIRM]"),
                ("search_files",  "Search filenames or contents across dirs"),
            ]),
            ("🖥️  Terminal & Process Management", [
                ("terminal",  "Execute shell commands (PowerShell/Bash) [CONFIRM]"),
                ("process",   "Monitor, inspect, list, or kill processes"),
            ]),
            ("🧠 Planning, Memory & Productivity", [
                ("todo",           "Track task checklists for multi-step goals"),
                ("memory",         "Store/recall persistent notes across sessions"),
                ("session_search", "Search past session histories & transcripts"),
                ("cronjob",        "Schedule one-time or recurring cron tasks"),
                ("clarify",        "Ask structured clarifying questions"),
            ]),
            ("🤖 Subagent Delegation & Code Execution", [
                ("execute_code",  "Execute Python code programmatically"),
                ("run_python_code","Python sandbox runner (stdout/stderr)"),
                ("delegate_task", "Spawn isolated subagents for parallel work"),
            ]),
            ("📚 Skills Management", [
                ("skills_list",  "List all available skills"),
                ("skill_view",   "View full content of a skill by name"),
                ("skill_manage", "Create, edit, or delete project skills"),
                ("use_skill",    "Load and execute an agent skill by name"),
            ]),
            ("👁️  Vision, Media & Text-to-Speech", [
                ("vision_analyze",  "Analyze images and visual inputs"),
                ("image_generate",  "Generate images from text prompts (FLUX/Stability)"),
                ("generate_image",  "Generate a new image from a description"),
                ("edit_image",      "Edit the most recently generated image"),
                ("video_generate",  "Generate videos from text prompts"),
                ("text_to_speech",  "Convert text to audio (Edge TTS / OpenAI / ElevenLabs)"),
            ]),
            ("📋 Kanban Board", [
                ("create_kanban_task", "Create a new task on the Kanban board"),
                ("update_kanban_task", "Update status of a Kanban task"),
                ("list_kanban_tasks",  "List all tasks on the Kanban board"),
            ]),
            ("🗓️  Scheduler", [
                ("schedule_task", "Schedule an automated task or reminder"),
            ]),
        ]
        print(f"\n{WHITE}{BOLD}ENABLED AGENT TOOLS  ({sum(len(t) for _, t in cats)} tools across {len(cats)} categories):{RESET}\n")
        for cat_name, tools in cats:
            print(f"  {MAROON}{BOLD}{cat_name}{RESET}")
            for name, desc in tools:
                print(f"    {GREEN}✓{RESET} {WHITE}{name:<22}{RESET}{MUTED}{desc}{RESET}")
            print()



    async def list_skills(self):
        from app.skills_service import list_skills as get_skills
        try:
            skills = get_skills()
            categories: dict[str, list] = {}
            for s in skills:
                cat = s.get("category", "general").capitalize()
                categories.setdefault(cat, []).append(s)

            print(f"\n{WHITE}{BOLD}AGENT SKILLS ({len(skills)} skills across {len(categories)} categories):{RESET}\n")
            for cat_name, items in sorted(categories.items()):
                print(f"  {MAROON}{BOLD}Category: {cat_name}{RESET} ({len(items)} skills)")
                for item in items[:8]:  # Show top items per category
                    desc = item.get('description', '').encode('ascii', errors='ignore').decode('ascii')[:65]
                    name = item['name'][:24]
                    print(f"    {GREEN}* {WHITE}{name:<24}{RESET}{MUTED}{desc}{RESET}")
                if len(items) > 8:
                    print(f"    {MUTED}... and {len(items) - 8} more in {cat_name}{RESET}")
                print()
        except Exception as e:
            print(f"  {MUTED}Error loading skills: {e}{RESET}\n")




    async def list_kanban(self):
        await self.send_chat("list kanban tasks")

    async def send_chat(self, user_input: str):
        if not self.auth_token:
            await self.ensure_auth()

        print(f"\n{MAROON}{BOLD}Argus ({self.current_model}):{RESET} ", end="", flush=True)
        
        payload = {
            "message": user_input,
            "model": self.current_model,
        }
        if self.conversation_id:
            payload["conversation_id"] = self.conversation_id

        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", f"{self.api_base}/api/chat", json=payload, headers=headers) as response:
                    if response.status_code != 200:
                        err_body = await response.aread()
                        print(f"\n{RED}Error (HTTP {response.status_code}): {err_body.decode('utf-8', errors='ignore')}{RESET}\n")
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        raw_data = line[6:].strip()
                        if raw_data == "[DONE]":
                            break
                        try:
                            data = json.loads(raw_data)
                            event_type = data.get("type")
                            
                            if event_type == "conversation_id":
                                self.conversation_id = data.get("id")
                            elif event_type == "text":
                                content = data.get("content", "")
                                print(content, end="", flush=True)
                            elif event_type == "tool_call":
                                tool_name = data.get("tool_name", "")
                                print(f"\n{CRIMSON}[Tool: {tool_name}]{RESET} ", end="", flush=True)
                            elif event_type == "tool_result":
                                res = data.get("result", {})
                                summary = res.get("summary") or res.get("stdout") or "Done"
                                print(f"{MUTED}({summary[:80]}){RESET}\n{MAROON}{BOLD}Argus:{RESET} ", end="", flush=True)
                            elif event_type == "error":
                                print(f"\n{RED}Error: {data.get('message')}{RESET}")
                        except Exception:
                            pass
                    print("\n")
        except Exception as e:
            print(f"\n{RED}Connection error: {e}{RESET}\n")

    async def run(self):
        self.print_banner()
        await self.ensure_auth()
        
        while self.running:
            try:
                user_input = input(f"{CREAM}{BOLD}you > {RESET}").strip()
                if not user_input:
                    continue

                if user_input.startswith("/"):
                    cmd_parts = user_input.split(maxsplit=1)
                    cmd = cmd_parts[0].lower()
                    arg = cmd_parts[1] if len(cmd_parts) > 1 else ""

                    if cmd in ("/exit", "/quit"):
                        print(f"\n{MAROON}Goodbye! 👁️{RESET}\n")
                        self.running = False
                    elif cmd in ("/help", "/h"):
                        self.print_help()
                    elif cmd == "/model":
                        if arg:
                            self.current_model = arg.strip()
                            print(f"{GREEN}Switched model to: {self.current_model}{RESET}\n")
                        else:
                            print(f"\n{WHITE}Current Model:{RESET} {self.current_model}")
                            print(f"{MUTED}Available: gemma4:cloud, gemma4:31b-cloud, nemotron-3-super:cloud, minimax-m3:cloud{RESET}\n")
                    elif cmd == "/tools":
                        await self.list_tools()
                    elif cmd == "/skills":
                        await self.list_skills()
                    elif cmd == "/kanban":
                        await self.list_kanban()
                    elif cmd in ("/new", "/reset"):
                        self.conversation_id = None
                        print(f"{GREEN}Reset conversation. Started new chat session.{RESET}\n")
                    else:
                        print(f"{RED}Unknown command '{cmd}'. Type /help for options.{RESET}\n")
                else:
                    await self.send_chat(user_input)
            except (KeyboardInterrupt, EOFError):
                print(f"\n\n{MAROON}Exiting Argus CLI. Goodbye! 👁️{RESET}\n")
                break


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    cli = ArgusCLI()
    asyncio.run(cli.run())


if __name__ == "__main__":
    main()
