# Comprehensive Techniques Report: web-ui-1 Project

> **Purpose:** Extract all key techniques, patterns, and architectural approaches for reuse in SentientAIBrowser.
> **Source:** `C:\Users\Andrew\OneDrive\Documents\Coding\web-ui-1`

---

## Table of Contents

1. [Classes & Their Purposes](#1-classes--their-purposes)
2. [Design Patterns](#2-design-patterns)
3. [Browser Automation Techniques](#3-browser-automation-techniques)
4. [LLM Integration Patterns](#4-llm-integration-patterns)
5. [State Management](#5-state-management)
6. [WebSocket & Real-Time Communication](#6-websocket--real-time-communication)
7. [Auth & Security](#7-auth--security)
8. [Error Handling & Resilience](#8-error-handling--resilience)
9. [Memory & Knowledge Management](#9-memory--knowledge-management)
10. [Task Orchestration & Planning](#10-task-orchestration--planning)

---

## 1. Classes & Their Purposes

### Core Infrastructure

| Class | File | Purpose |
|-------|------|---------|
| `AppSettings` | `src/core/config.py` | Pydantic `BaseSettings` for env-var-driven config (SECRET_KEY, GOOGLE_CLIENT_ID/SECRET, API keys). Reads from `.env`. |
| `create_app()` | `src/core/factory.py` | FastAPI app factory — mounts `SessionMiddleware`, `CORSMiddleware`, includes routers (`/auth`, `/agent`, `/system`). |

### Browser Layer

| Class | File | Purpose |
|-------|------|---------|
| `CustomBrowser` | `src/browser/custom_browser.py` | Extends `browser_use.Browser`. Adds `user_data_dir` for persistent Chromium profiles. Overrides `new_context()` to use `launch_persistent_context` with anti-detection flags. |
| `NavigationController` | `src/controller/navigation_controller.py` | URL safety classifier (SAFE/SUSPICIOUS/EXTERNAL). Tab manager (closes duplicates, suspicious, limits to 5). Navigation wrapper with `domcontentloaded` wait. |
| `CustomController` | `src/controller/custom_controller.py` | Extends `browser_use.Controller`. Composes 6 Mixin classes. Manages HUD injection/refresh, agent control exposure to browser (pause/stop/skip/complete), `execute_action_by_name()` with retry. |

### Controller Action Mixins

| Mixin | File | Actions |
|-------|------|---------|
| `NavigationActionsMixin` | `src/controller/actions/navigation_actions.py` | 25+ actions: `search_google` (udm=14), `smart_navigate`, `clear_view` (5-stage cleanup), `smart_click`, scroll variants, `wait_for_content`, `wait_for_dynamic_update` (MutationObserver). |
| `ExtractionActionsMixin` | `src/controller/actions/extraction_actions.py` | 30+ actions: `extract_page_links`, `find_navigation_options` (semantic scoring), `extract_tables`, `analyze_page_structure`, `get_google_scholar_citation/citations` (bulk), `format_citation` (APA), `read_pdf_file`, `analyze_page_layout` (LLM-powered), `save/read_page_content`. |
| `InteractionActionsMixin` | `src/controller/actions/interaction_actions.py` | `hover_element`, `press_key`, `upload_file_to_element/by_text/drag_and_drop`, `verify_element_state`, `hover_and_click_by_text`, `set_date/range/color_by_label`, `handle_next_dialog`, `select_dropdown_option`, `drag_and_drop`, `execute_js_in_iframe`, clipboard ops, `solve_captcha` (reCAPTCHA/Turnstile/generic), `post_to_yellowdig`. |
| `SystemActionsMixin` | `src/controller/actions/system_actions.py` | `update_hud`, `add_plan_step/update_plan_step/mark_step_complete/complete_current_step`, `save_text_to_file`, `clear_browser_data`, `save/get_site_knowledge`, `learn_page_topic_and_navigation`, `search/read/list_knowledge_base`. |
| `DebuggingActionsMixin` | `src/controller/actions/debugging_actions.py` | `take_full_page_screenshot`, `take_element_screenshot`, `highlight_element`, `remove_highlights`, `execute_javascript`. |
| `UserActionsMixin` | `src/controller/actions/user_actions.py` | Extension point for custom tools. Example: `get_weather` via Open-Meteo API. |

### Agent Layer

| Class | File | Purpose |
|-------|------|---------|
| `BrowserUseAgent` | `src/agent/src/agent/browser_use/browser_use_agent.py` | Extends `browser_use.Agent`. Adds: confirmer LLM validation, model priority list switching, cost saver/smart retry, background planner loop, initial actions execution, custom memory injection, heuristic hooks (pre/post step), async history persistence, GIF generation. **780 lines — the central agent class.** |
| `AgentHeuristics` | `src/agent/browser_use/agent_heuristics.py` | Companion class to `BrowserUseAgent`. Provides: `manage_model_switching()` (smart retry upgrades, cost saver downgrades), `suggest_alternative_strategy()`, `check_completion_heuristics()` (quiz/order signals), `detect_loop()`, `check_blocking_elements()` (CAPTCHA, Chrome promo), `check_login_status()`, `check_navigation_recovery()`, `check_and_add_subtasks()` (LLM subtask extraction), `detect_progress()` (regex "Question X of Y"), `check_max_failures()`. |
| `QuizStateManager` | `src/agent/browser_use/quiz_state.py` | Persistent quiz progress state. Tracks `current_question`, `total_questions`, `last_known_anchor`, `is_interrupted`. File-backed JSON persistence. `sync_from_page()` regex parsing. |
| `EnhancedDeepResearchAgent` | `src/agent/deep_research/enhanced_agent.py` | LLM-driven agent with phased execution: Discovery → Planning (subtask extraction) → Rubric Analysis → Action Loop (analyze, focus, decide, execute). Uses `CustomController.execute_action_by_name()` directly. Has Co-coordinator link checking. |
| `DeepResearchAgent` | `src/agent/deep_research/deep_research_agent.py` | LangGraph state machine with 4 nodes: `planning_node`, `research_execution_node`, `synthesis_node`, `publish_node`. Conditional routing. Shared browser. MCP tool integration. Task resume from saved state. |
| `DeepResearchStateManager` | `src/agent/deep_research/state_manager.py` | Persistence for deep research: loads/saves plan (markdown ↔ structured), search results (JSON), reports (markdown). Archives to knowledge base. |
| `TaskManager` (deep_research) | `src/agent/deep_research/task_manager.py` | Hierarchical plan manager (Categories → Tasks). Navigation, status updates, dynamic plan modification: `add_task`, `add_subtasks`, `renegotiate_plan`, `merge_plan`. Static `parse_plan_json()` from LLM output. |

### WebUI Layer

| Class | File | Purpose |
|-------|------|---------|
| `WebuiManager` | `src/webui/webui_manager.py` | Central state holder for 3 agent types (browser_use, deep_research, enhanced). Gradio component registry (`id_to_component`/`component_to_id`). Config save/load with JSON. Thread-safe with `config_lock` and retry logic for Windows file ops. Plan management with `bu_plan_updated` flag for UI polling. |
| `TaskManager` (webui) | `src/webui/task_manager.py` | Manages async task lifecycle: `start()`, `stop()` (graceful 2s timeout → force cancel), `pause()`, `resume()`. Flag manipulation on agent state. |
| `BrowserUseAgentRunner` | `src/webui/components/browser_use_agent_runner.py` | Orchestrates agent setup, run, and teardown for the WebUI submit flow. |

### Utility Layer

| Class/Function | File | Purpose |
|-------|------|---------|
| `SimpleMemoryManager` | `src/utils/memory_utils.py` | File-based site-specific knowledge storage in markdown. Domain-based file naming (`site_knowledge_{domain}.md`). Global singleton. |
| `IOManager` | `src/utils/io_manager.py` | Async file I/O using `asyncio.to_thread()` to avoid blocking event loop. Sync fallbacks. |
| `get_llm_model()` | `src/utils/llm_provider.py` | Factory supporting 15+ LLM providers. Custom `DeepSeekR1ChatOpenAI` and `DeepSeekR1ChatOllama` classes handling `<think>` tag parsing. |
| `ConnectionService` | `src/features/communication/communication_ws_manager.py` | WebSocket connection registry: `connect()`, `disconnect()`, `send_personal_message()`, `broadcast()` (snapshot iteration). Singleton. |
| `UserService` | `src/features/user/user_service.py` | Repository pattern with `IUserRepository` protocol. User CRUD. |

---

## 2. Design Patterns

### Factory Pattern
```python
# src/core/factory.py - App Factory
def create_app() -> FastAPI:
    app = FastAPI(title="Browser Use API")
    app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
    app.include_router(auth_router, prefix="/auth")
    app.include_router(agent_router, prefix="/agent")
    return app

# src/utils/browser_factory.py - Browser Factory
def create_browser(config: Dict) -> CustomBrowser:
    # OS detection for binary paths
    # Persistent profile support
    # Proxy, security toggles
    ...

# src/agent/factory.py - Agent Factory
async def create_agent(task, llm, browser, browser_context, ...) -> BrowserUseAgent:
    ...

# src/utils/llm_provider.py - LLM Factory
def get_llm_model(provider: str, **kwargs) -> BaseChatModel:
    if provider == "openai": return ChatOpenAI(...)
    elif provider == "anthropic": return ChatAnthropic(...)
    # 15+ providers
```

### Mixin Pattern (Composition over Inheritance)
```python
# src/controller/custom_controller.py
class CustomController(Controller):
    def __init__(self):
        super().__init__()
        # Compose behavior via Mixins
        NavigationActionsMixin._register_navigation_actions(self)
        InteractionActionsMixin._register_interaction_actions(self)
        ExtractionActionsMixin._register_extraction_actions(self)
        DebuggingActionsMixin._register_debugging_actions(self)
        SystemActionsMixin._register_system_actions(self)
        UserActionsMixin._register_user_actions(self)
```

### Strategy Pattern (Model Switching)
```python
# src/agent/browser_use/agent_heuristics.py
def manage_model_switching(self):
    # Smart Retry: Upgrade model on consecutive failures
    if self.agent.enable_smart_retry and consecutive_failures >= threshold:
        self._switch_to_next_model(direction="up")  # Upgrade
    
    # Cost Saver: Downgrade on success streaks
    if self.agent.enable_cost_saver and success_streak >= threshold:
        self._switch_to_next_model(direction="down")  # Downgrade
```

### Observer Pattern (Callbacks)
```python
# Agent step/done callbacks
agent.step_callback = async def(state, output, step_num): ...
agent.done_callback = async def(history): ...
agent.validation_callback = async def(think, reason, confirmed): ...

# Controller callbacks
controller.set_callbacks({
    "update_plan": async def(step_index, status): ...,
})

# Browser page event listeners
page.once("dialog", handle_dialog)  # One-time dialog handler
```

### Singleton Pattern
```python
# src/utils/memory_utils.py
_memory_manager_instance = None
def get_memory_manager(kb_dir=None) -> SimpleMemoryManager:
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = SimpleMemoryManager(kb_dir)
    return _memory_manager_instance

# src/features/communication/communication_ws_manager.py
connection_service = ConnectionService()  # Module-level singleton
```

### State Machine (LangGraph)
```python
# src/agent/deep_research/deep_research_agent.py
from langgraph.graph import StateGraph, END

workflow = StateGraph(DeepResearchState)
workflow.add_node("planning", planning_node)
workflow.add_node("research_execution", research_execution_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("publish", publish_node)

workflow.set_entry_point("planning")
workflow.add_conditional_edges("research_execution", should_continue, {
    "continue": "research_execution",
    "synthesize": "synthesis",
    "stop": END
})
workflow.add_edge("planning", "research_execution")
workflow.add_edge("synthesis", "publish")
workflow.add_edge("publish", END)
```

### Repository Pattern
```python
# src/features/user/user_service.py
class IUserRepository(Protocol):
    async def get_user(self, user_id: str) -> Optional[User]: ...
    async def create_user(self, user: User) -> User: ...

class UserService:
    def __init__(self, repository: IUserRepository):
        self.repository = repository
```

### Registry Pattern (Action Registration)
```python
# browser_use Controller uses a registry pattern
@self.registry.action("Description of what the action does")
async def action_name(browser: BrowserContext, param: str):
    # Action implementation
    return "result"
```

### Component Registry Pattern (Gradio)
```python
# src/webui/webui_manager.py
class WebuiManager:
    def __init__(self):
        self.id_to_component: Dict[str, Component] = {}
        self.component_to_id: Dict[Component, str] = {}
    
    def add_components(self, tab_name: str, components: Dict[str, Component]):
        for comp_id, comp in components.items():
            full_id = f"{tab_name}.{comp_id}"
            self.id_to_component[full_id] = comp
            self.component_to_id[comp] = full_id
```

---

## 3. Browser Automation Techniques

### Anti-Detection Browser Launch
```python
# src/browser/custom_browser.py
async def new_context(self, config=None):
    context = await self.playwright.chromium.launch_persistent_context(
        user_data_dir=self.user_data_dir,
        headless=False,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-infobars",
        ],
        viewport={"width": 1280, "height": 720},
        bypass_csp=True,
        java_script_enabled=True,
    )
```

### OS-Aware Browser Binary & Profile Detection
```python
# src/utils/browser_factory.py
def create_browser(config):
    system = platform.system()
    if system == "Windows":
        chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
        profile_base = os.path.expandvars("%LOCALAPPDATA%/Google/Chrome/User Data")
    elif system == "Darwin":
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        profile_base = os.path.expanduser("~/Library/Application Support/Google/Chrome")
    # Profile name mapping (e.g., "Profile 1" → actual profile dir)
```

### JavaScript Injection Library (~40 scripts)
```python
# src/utils/browser_scripts.py - Key injection scripts:

# 1. Cookie Banner Dismissal (with deep Shadow DOM traversal)
JS_CLOSE_COOKIE_BANNERS = """
() => {
    function deepQuerySelectorAll(root, selector) {
        let results = [...root.querySelectorAll(selector)];
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                results.push(...deepQuerySelectorAll(el.shadowRoot, selector));
            }
        });
        return results;
    }
    // Clicks accept/dismiss buttons in cookie banners
}
"""

# 2. Smart Semantic Scrolling with Visual Highlight
JS_SMART_SCROLL = """
(query) => {
    // Searches DOM for text matching query
    // Scrolls element into view with smooth behavior
    // Creates temporary highlight overlay (2s fade)
    // Returns true/false for success
}
"""

# 3. DOM Purification (removes ads, overlays, distractions)
JS_PURIFY_DOM = """
() => {
    // Removes elements by selectors: [class*='ad-'], [id*='ad-'], 
    // iframe[src*='ads'], .cookie-banner, .newsletter-popup
    // Removes fixed/sticky positioned overlays
}
"""

# 4. Full HUD Injection (bottom panel with plan, controls, input)
JS_INJECT_HUD = """
(data) => {
    // Creates bottom-panel overlay showing:
    //   - Current goal
    //   - Plan steps with status icons (✅❌⏳▶️)
    //   - Last action result
    //   - Control buttons: Pause, Stop, Complete, Skip
    //   - User input field for providing context
    // Uses window.__agentControl for bidirectional communication
}
"""

# 5. MutationObserver for Dynamic Content Detection
JS_MONITOR_MUTATIONS = """
() => {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
            let hasNewContent = mutations.some(m => 
                m.addedNodes.length > 0 || m.type === 'characterData'
            );
            if (hasNewContent) {
                observer.disconnect();
                resolve(true);
            }
        });
        observer.observe(document.body, {
            childList: true, subtree: true, characterData: true
        });
        setTimeout(() => { observer.disconnect(); resolve(false); }, timeout);
    });
}
"""

# 6. Navigation Control Detection
JS_DETECT_NAVIGATION_CONTROLS = """
() => {
    // Detects: pagination, wizard steps, login forms, auth pages,
    // notification prompts, install app banners
    let signals = [];
    if (document.querySelector('.pagination, nav[aria-label*="page"]'))
        signals.push('PAGINATION detected');
    if (document.querySelector('[class*="wizard"], [class*="stepper"]'))
        signals.push('WIZARD/MULTI-STEP detected');
    return signals.join('; ');
}
"""
```

### 5-Stage View Clearing Pipeline
```python
# src/controller/actions/navigation_actions.py → clear_view
async def clear_view(browser: BrowserContext):
    page = await browser.get_current_page()
    # Stage 1: Handle Google Vignette (special interstitial ad)
    await handle_vignette(page)
    # Stage 2: Dismiss Chrome promos
    await close_chrome_promo(page)
    # Stage 3: Close cookie banners (deep Shadow DOM)
    await close_cookie_banners(page)
    # Stage 4: Dismiss notification/install/age-gate prompts
    await dismiss_notification_prompt(page)
    await dismiss_install_app(page)
    await dismiss_age_gate(page)
    # Stage 5: Close modals, chat widgets, purify DOM, remove ads/overlays
    await page.evaluate(JS_PURIFY_DOM)
    await page.evaluate(JS_REMOVE_ADS)
    await page.evaluate(JS_REMOVE_OVERLAYS)
    await page.evaluate(JS_CLOSE_NEWSLETTER)
```

### Smart Navigation with Validation
```python
# smart_navigate action
async def smart_navigate(browser, url):
    page = await browser.get_current_page()
    
    # 1. Navigate with networkidle wait
    response = await page.goto(url, wait_until="networkidle", timeout=30000)
    
    # 2. Validate HTTP status
    if response and response.status >= 400:
        return f"Navigation failed: HTTP {response.status}"
    
    # 3. Check for blocking elements
    blocking = await self.heuristics.check_blocking_elements()
    if blocking:
        await clear_view(browser)
    
    # 4. Verify page loaded meaningful content
    content = await page.evaluate("document.body.innerText.length")
    if content < 50:
        return "Page appears empty or blocked"
```

### Smart Click with Overlay Auto-Recovery
```python
# smart_click action - retry on overlay interception
async def smart_click(browser, text):
    for attempt in range(3):
        try:
            element = page.get_by_text(text).first
            await element.click()
            return f"Clicked '{text}'"
        except Exception as e:
            if "intercept" in str(e).lower():
                await clear_view(browser)  # Remove overlays
                continue
            raise
```

### Download Resource - Dual Strategy
```python
# src/controller/helpers.py
async def download_resource(page, url, filepath):
    # Strategy 1: In-browser fetch with FileReader → base64
    try:
        b64 = await page.evaluate("""
            async (url) => {
                const resp = await fetch(url);
                const blob = await resp.blob();
                return new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = () => r(reader.result.split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            }
        """, url)
        # Decode base64 and write to file
    except:
        # Strategy 2: Fallback to aiohttp with browser cookies
        cookies = await page.context.cookies()
        async with aiohttp.ClientSession(cookies=...) as session:
            async with session.get(url) as resp:
                # Write response bytes to file
```

### Tab Management
```python
# src/controller/navigation_controller.py
async def manage_tabs(self, browser_context):
    pages = browser_context.pages
    
    # Close duplicate URLs
    seen_urls = set()
    for page in pages:
        if page.url in seen_urls:
            await page.close()
        seen_urls.add(page.url)
    
    # Close suspicious domain tabs
    for page in pages:
        if self.evaluate_url(page.url) == "SUSPICIOUS":
            await page.close()
    
    # Limit to max 5 tabs
    while len(browser_context.pages) > 5:
        await browser_context.pages[-1].close()
```

### Google Search with Clean Results
```python
# Uses undocumented `udm=14` parameter for clean Google results
async def search_google(browser, query):
    encoded = urllib.parse.quote(query)
    url = f"https://www.google.com/search?q={encoded}&udm=14"
    # udm=14 gives a simplified, ad-free result layout
```

---

## 4. LLM Integration Patterns

### Multi-Provider Factory with 15+ Providers
```python
# src/utils/llm_provider.py
def get_llm_model(provider: str, model_name: str, temperature=0.6, 
                   base_url=None, api_key=None, **kwargs):
    if provider == "openai":
        return ChatOpenAI(model=model_name, temperature=temperature, api_key=api_key)
    elif provider == "anthropic":
        return ChatAnthropic(model=model_name, temperature=temperature)
    elif provider == "google":
        return ChatGoogleGenerativeAI(model=model_name, temperature=temperature)
    elif provider == "ollama":
        return ChatOllama(model=model_name, base_url=base_url, 
                         num_ctx=kwargs.get("num_ctx", 16000))
    elif provider == "deepseek":
        if "r1" in model_name.lower():
            return DeepSeekR1ChatOpenAI(...)  # Custom class for reasoning models
        return ChatOpenAI(model=model_name, base_url="https://api.deepseek.com/v1")
    # ... azure_openai, grok, mistral, alibaba, ibm, moonshot, 
    #     unbound, siliconflow, modelscope, vertex
```

### DeepSeek R1 Reasoning Model Handler
```python
# Custom classes that parse <think>...</think> tags from reasoning models
class DeepSeekR1ChatOpenAI(ChatOpenAI):
    def _process_response(self, response):
        content = response.content
        # Extract reasoning from <think> tags
        think_match = re.search(r'<think>(.*?)</think>', content, re.DOTALL)
        if think_match:
            reasoning = think_match.group(1)
            # Strip think tags from final output
            clean = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            response.content = clean.strip()
        return response
```

### Confirmer LLM (Output Validation)
```python
# BrowserUseAgent._validate_output()
async def _validate_output(self):
    # 1. Select prompt based on strictness (1-10 scale)
    if self.confirmer_strictness <= 3:
        prompt = CONFIRMER_PROMPT_FAST  # Quick yes/no
    else:
        prompt = CONFIRMER_PROMPT_STANDARD  # Detailed analysis

    # 2. Build multimodal messages (text + screenshot)
    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=[
            {"type": "text", "text": f"Task: {self.task}\nURL: {url}\nThought: {thought}"},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{screenshot}"}}
        ])
    ]

    # 3. Call confirmer LLM with retry
    response = await retry_async(lambda: self.confirmer_llm.ainvoke(messages))

    # 4. Parse YES/NO with reason extraction
    is_confirmed = response.content.strip().upper().startswith("YES")
    
    # 5. Dynamic plan modification on rejection
    if not is_confirmed:
        if "CAPTCHA" in reason.upper():
            manager.add_plan_step("Solve CAPTCHA detected on page")
        elif "LOGIN" in reason.upper():
            manager.add_plan_step("Perform Login/Authentication")
```

### Multi-LLM Architecture (4 LLM roles)
```python
# From agent_logic.py / shared.py
async def initialize_agent_llms(settings):
    # 1. Main LLM - primary agent reasoning
    main_llm = await initialize_llm(settings["main_provider"], settings["main_model"])
    
    # 2. Planner LLM - background plan updates
    planner_llm = await initialize_llm(settings["planner_provider"], settings["planner_model"])
    
    # 3. Confirmer LLM - output validation
    confirmer_llm = await initialize_llm(settings["confirmer_provider"], settings["confirmer_model"])
    
    # 4. Priority LLMs - model switching cascade
    priority_llms = [
        {"provider": "ollama", "model": "qwen3:8b"},        # Cheapest
        {"provider": "google", "model": "gemini-2.0-flash"}, # Mid-tier
        {"provider": "openai", "model": "gpt-4o"},           # Premium
    ]
    return main_llm, planner_llm, confirmer_llm, priority_llms
```

### Structured Output with AgentOutput Schema
```python
# BrowserUseAgent.__init__()
if isinstance(original_llm, Runnable):
    structured_llm = original_llm.with_structured_output(AgentOutput)
    # Forces LLM to produce JSON conforming to AgentOutput Pydantic model
```

### Tool Calling Method Auto-Detection
```python
# BrowserUseAgent._set_tool_calling_method()
def _set_tool_calling_method(self):
    if 'Ollama' in self.chat_model_library:
        return 'raw'  # Ollama needs raw JSON parsing
    elif any(m in self.model_name.lower() for m in ['qwen', 'deepseek', 'gpt', 'claude']):
        return 'function_calling'  # Native function calling
    elif self.chat_model_library == 'ChatGoogleGenerativeAI':
        return None  # Google handles it internally
```

### LLM-Powered Page Analysis
```python
# ExtractionActionsMixin.analyze_page_layout
async def analyze_page_layout(browser: BrowserContext):
    page_content = await page.evaluate(JS_GET_MAIN_CONTENT)
    response = await self.llm.ainvoke([
        SystemMessage(content=PAGE_LAYOUT_ANALYSIS_PROMPT),
        HumanMessage(content=page_content[:8000])
    ])
    return parse_json_safe(response.content)
```

### MCP (Model Context Protocol) Integration
```python
# src/utils/mcp_client.py
async def setup_mcp_client_and_tools():
    client = MultiServerMCPClient()
    await client.connect_to_servers(config)
    
    tools = []
    for tool_schema in client.list_tools():
        # Dynamic Pydantic model creation from tool schema
        model = create_tool_param_model(tool_schema)
        tools.append(StructuredTool.from_function(
            coroutine=tool_func,
            name=tool_schema["name"],
            args_schema=model
        ))
    return tools

def create_tool_param_model(schema):
    """Creates Pydantic models from JSON schema recursively."""
    fields = {}
    for prop_name, prop_schema in schema["properties"].items():
        python_type = resolve_type(prop_schema)  # Handles enums, unions, nested models
        fields[prop_name] = (python_type, Field(description=prop_schema.get("description", "")))
    return create_model(schema["name"], **fields)
```

---

## 5. State Management

### Gradio Component Registry & Config Persistence
```python
# src/webui/webui_manager.py
class WebuiManager:
    def __init__(self):
        self.id_to_component = {}
        self.component_to_id = {}
        self.config_lock = threading.Lock()
    
    def save_config(self, config_name="last_config"):
        """Saves all component values to JSON with Windows file lock retry."""
        config = {}
        for comp_id, comp in self.id_to_component.items():
            config[comp_id] = comp.value
        
        with self.config_lock:
            for attempt in range(3):
                try:
                    IOManager.write_file_sync(path, json.dumps(config, indent=2))
                    break
                except PermissionError:
                    time.sleep(0.5)  # Windows file lock retry
    
    def load_last_config(self):
        """Restores all component values from JSON on startup."""
        config = json.loads(IOManager.read_file_sync(path))
        outputs = []
        for comp in self.get_components():
            comp_id = self.component_to_id.get(comp)
            if comp_id in config:
                outputs.append(gr.update(value=config[comp_id]))
            else:
                outputs.append(gr.update())
        return outputs
    
    # Auto-save binding on every component change
    for comp in ui_manager.get_components():
        if hasattr(comp, "change"):
            comp.change(fn=partial(ui_manager.update_parameter, comp), inputs=[comp])
```

### Agent Task Lifecycle (Start/Stop/Pause/Resume)
```python
# src/webui/task_manager.py
class TaskManager:
    async def start(self, agent, max_steps):
        self.task = asyncio.create_task(agent.run(max_steps=max_steps))
        
    async def stop(self):
        agent.state.stopped = True
        # Graceful: wait 2 seconds for natural stop
        try:
            await asyncio.wait_for(self.task, timeout=2.0)
        except asyncio.TimeoutError:
            # Force: cancel the task
            self.task.cancel()
    
    async def pause(self):
        agent.state.paused = True  # Agent checks this flag in pre-step
    
    async def resume(self):
        agent.state.paused = False
```

### Plan State Management (UI ↔ Agent Bidirectional)
```python
# WebuiManager plan state
webui_manager.bu_plan = [
    {"step": "Navigate to site", "status": "completed", "action": None, "params": None},
    {"step": "Click login button", "status": "in_progress", "action": "click_element_by_text", "params": {"text": "Login"}},
    {"step": "Fill credentials", "status": "pending"},
]
webui_manager.bu_plan_updated = True  # Flag for UI polling

# Agent → UI: Controller updates plan via webui_manager
async def update_plan_step(browser, step_index, status, result=None):
    webui_manager.update_plan_step_status(idx, status, result=result)
    await self.refresh_hud(browser, last_action=msg)

# UI → Agent: User edits plan in Gradio, synced on next step
```

### Deep Research State Persistence (Markdown ↔ Structured)
```python
# DeepResearchStateManager
def save_plan(self, plan, current_cat_idx, current_task_idx):
    """Saves plan as human-readable markdown with checkbox syntax."""
    content = "# Research Plan\n\n"
    for cat in plan:
        content += f"## {cat['category_name']}\n\n"
        for task in cat['tasks']:
            marker = "- [x]" if task["status"] == "completed" else "- [-]" if task["status"] == "failed" else "- [ ]"
            content += f"  {marker} {task['task_description']}\n"

def _load_plan(self):
    """Parses markdown back to structured data, finds next pending task."""
    # Reads ## headers as categories
    # Reads - [ ] / - [x] / - [-] as task statuses
    # Returns (plan, next_cat_idx, next_task_idx)
```

### Quiz State Persistence
```python
# QuizStateManager - file-backed JSON state
class QuizStateManager:
    def __init__(self, persistence_path=None):
        self.state = {
            "current_question": 0,
            "total_questions": 0,
            "completed_steps": [],
            "last_known_anchor": None,
            "is_interrupted": False
        }
    
    def sync_from_page(self, page_text):
        """Auto-detect progress from page content."""
        match = re.search(r"Question\s+(\d+)\s*(?:of|/)\s*(\d+)", page_text, re.IGNORECASE)
        if match:
            self.update_progress(int(match.group(1)), int(match.group(2)))
```

---

## 6. WebSocket & Real-Time Communication

### WebSocket Connection Registry
```python
# src/features/communication/communication_ws_manager.py
class ConnectionService:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        # Snapshot-based iteration for thread safety
        connections = self.active_connections[:]
        for connection in connections:
            await connection.send_text(message)

# FastAPI WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        pass
```

### Browser ↔ Agent Real-Time Communication (HUD)
```python
# Bidirectional browser-to-agent communication via JS injection
# In CustomController:

async def _expose_agent_control(self, browser):
    """Exposes Python agent controls to the browser via page.exposeFunction."""
    page = await browser.get_current_page()
    
    # Browser → Agent: User can pause/stop from the HUD overlay
    await page.expose_function("__agentPause", lambda: agent.state.paused = True)
    await page.expose_function("__agentStop", lambda: agent.state.stopped = True)
    await page.expose_function("__agentSkip", lambda: self._skip_current_step())
    await page.expose_function("__agentComplete", lambda: self._complete_current_step())
    await page.expose_function("__agentAddTask", lambda task: self._add_task(task))

# Agent → Browser: HUD update pushes plan state to overlay
async def _update_hud_impl(self, browser, data):
    page = await browser.get_current_page()
    await page.evaluate(JS_INJECT_HUD, data)
    # data = {"plan": [...], "goal": "...", "last_action": "..."}
```

### Gradio Async Generator Pattern (Streaming Updates)
```python
# src/webui/components/browser_use_agent_tab.py
async def submit_wrapper(*args) -> AsyncGenerator[List[Any], None]:
    """Streams real-time updates to Gradio UI components."""
    async for update in safe_execution(handle_submit, webui_manager, components_dict):
        yield map_dict_to_gradio_outputs(update, run_tab_outputs)

# safe_execution wraps async generators with error handling
async def safe_execution(func, *args):
    try:
        if inspect.isasyncgenfunction(func):
            async for result in func(*args):
                yield result
        else:
            result = await func(*args)
            yield result
    except Exception as e:
        logger.error(f"Error: {e}")
        yield {agent_status: gr.update(value=f"Error: {e}")}
```

### Agent "Ask for Help" Pattern (Human-in-the-Loop)
```python
# Browser agent can pause and wait for user input
async def _ask_assistant_callback(webui_manager, query, browser_context):
    # 1. Add question to chat
    webui_manager.bu_chat_history.append({
        "role": "assistant",
        "content": f"**Need Help:** {query}\nPlease respond below..."
    })
    
    # 2. Create async event and wait for user
    webui_manager.bu_response_event = asyncio.Event()
    await asyncio.wait_for(webui_manager.bu_response_event.wait(), timeout=3600.0)
    
    # 3. Return user's response to agent
    return webui_manager.bu_user_help_response
```

---

## 7. Auth & Security

### OAuth2 with Google
```python
# src/core/config.py
class AppSettings(BaseSettings):
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

# src/core/factory.py
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# src/auth/auth_router.py
# Google OAuth flow with session-based auth
```

### URL Safety Evaluation
```python
# NavigationController
def evaluate_url(self, url: str) -> str:
    """Classifies URLs as SAFE, SUSPICIOUS, or EXTERNAL."""
    allowed = ["google.com", "wikipedia.org"]  # Configurable whitelist
    suspicious = ["facebook.com", "twitter.com", "instagram.com", "reddit.com"]
    
    domain = urlparse(url).netloc.lower()
    if any(a in domain for a in allowed): return "SAFE"
    if any(s in domain for s in suspicious): return "SUSPICIOUS"
    return "EXTERNAL"
```

### Co-Coordinator Link Checking (LLM-based)
```python
# EnhancedDeepResearchAgent.check_link()
async def check_link(self, url: str, goal: str) -> bool:
    """Uses LLM to determine if a link is relevant to the goal vs a distraction."""
    prompt = f"Is this URL relevant to the goal '{goal}'? URL: {url}\nAnswer YES or NO."
    response = await self.llm.ainvoke([HumanMessage(content=prompt)])
    return "YES" in response.content.upper()
```

### Browser Anti-Detection
```python
# Anti-automation detection flags
args = [
    "--disable-blink-features=AutomationControlled",  # Hides webdriver flag
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-infobars",  # Hides "Chrome is being controlled" bar
]
# bypass_csp=True allows injecting scripts past Content Security Policy
```

### CAPTCHA Detection & Handling
```python
# solve_captcha action
async def solve_captcha(browser):
    page = await browser.get_current_page()
    
    # Google reCAPTCHA
    recaptcha = page.frame_locator("iframe[src*='google.com/recaptcha'][src*='anchor']")
    if await recaptcha.locator(".recaptcha-checkbox-border").count() > 0:
        await recaptcha.locator(".recaptcha-checkbox-border").click()
    
    # Cloudflare Turnstile
    cf = page.frame_locator("iframe[src*='challenges.cloudflare.com']")
    if await cf.locator("input[type='checkbox']").count() > 0:
        await cf.locator("input[type='checkbox']").click()
    
    # Generic "I am human" buttons
    human_btns = page.locator("button:has-text('I am human'), button:has-text('Verify')")
    if await human_btns.count() > 0:
        await human_btns.first.click()
```

---

## 8. Error Handling & Resilience

### Smart Retry with Model Upgrading
```python
# AgentHeuristics.manage_model_switching()
def manage_model_switching(self):
    # On consecutive failures: upgrade to more capable (expensive) model
    if self.agent.enable_smart_retry:
        if self.agent.state.consecutive_failures >= 3:
            next_idx = self.agent.current_model_index + 1
            if next_idx < len(self.agent.model_priority_list):
                new_model = get_llm_model(**self.agent.model_priority_list[next_idx])
                self.agent.llm = new_model
                self.agent.current_model_index = next_idx
                self.agent.switched_to_retry_model = True
    
    # On success streak: downgrade to cheaper model (Cost Saver)
    if self.agent.enable_cost_saver:
        if self.agent.successful_steps_since_switch >= 5:
            prev_idx = self.agent.current_model_index - 1
            if prev_idx >= 0:
                cheaper_model = get_llm_model(**self.agent.model_priority_list[prev_idx])
                self.agent.llm = cheaper_model
                self.agent.using_cheap_model = True
```

### Loop Detection
```python
def detect_loop(self):
    """Detects if agent is repeating same action on same URL."""
    history = self.agent.state.history.history
    if len(history) >= 3:
        last_3 = history[-3:]
        urls = [h.state.url for h in last_3]
        actions = [str(h.model_output.action) if h.model_output else "" for h in last_3]
        
        if len(set(urls)) == 1 and len(set(actions)) == 1:
            self.inject_message(
                "LOOP DETECTED: Same action repeated 3 times. "
                "CHANGE STRATEGY IMMEDIATELY."
            )
```

### Timeout Recovery
```python
# BrowserUseAgent.run() - per-step timeout handling
except Exception as e:
    if "Timeout" in str(e) and "exceeded" in str(e):
        self.state.consecutive_failures += 1
        try:
            page = await self.heuristics._get_current_page()
            if page and not page.is_closed():
                await page.reload(wait_until="domcontentloaded", timeout=15000)
                self.heuristics.inject_message(
                    "SYSTEM: Timeout occurred. Page reloaded. Re-assess state."
                )
        except Exception:
            pass
        continue  # Don't crash, continue to next step
```

### Graceful Agent Stop (2-Phase)
```python
async def stop(self):
    agent.state.stopped = True
    # Phase 1: Graceful - let current step finish
    try:
        await asyncio.wait_for(self.task, timeout=2.0)
    except asyncio.TimeoutError:
        # Phase 2: Force cancel
        self.task.cancel()
        try:
            await self.task
        except asyncio.CancelledError:
            pass
```

### Retry Utility
```python
# src/utils/utils.py
async def retry_async(func, max_retries=3, delay=1.0, logger=None, error_message=""):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            if logger:
                logger.warning(f"{error_message}: {e}. Retry {attempt+1}/{max_retries}")
            await asyncio.sleep(delay * (attempt + 1))  # Linear backoff
```

### Smart Scan with Retry on Empty
```python
# src/controller/helpers.py
async def smart_scan(page, js_script, *args, retry_on_empty=True):
    """Executes JS with retry after waiting for DOM stability."""
    result = await page.evaluate(js_script, *args)
    
    if not result and retry_on_empty:
        # Wait for DOM to stabilize
        await page.wait_for_timeout(2000)
        # Try again
        result = await page.evaluate(js_script, *args)
    
    return result
```

### Navigation State Assessment
```python
# src/agent/browser_use/navigation_recovery.py
def evaluate_site_state(page_content, current_step, total_steps):
    """Categorizes current navigation state."""
    content_lower = page_content.lower()
    
    if "about:blank" in content_lower:
        return {"status": "lost", "action_required": "RENAVIGATE"}
    elif any(x in content_lower for x in ["404", "500", "access denied"]):
        return {"status": "failed", "action_required": "GO_BACK_AND_RETRY"}
    elif "captcha" in content_lower:
        return {"status": "blocked", "action_required": "SOLVE_CAPTCHA"}
    elif "google_vignette" in content_lower:
        return {"status": "blocked", "action_required": "CLOSE_OVERLAY"}
    
    return {"status": "on_track"}
```

### Auto-Save on Stuck
```python
# AgentHeuristics.check_max_failures()
async def check_max_failures(self):
    if self.agent.state.consecutive_failures >= self.agent.max_consecutive_failures:
        if self.agent.auto_save_on_stuck:
            # Save current history before stopping
            await self.agent.save_history_async(self.agent.save_history_path)
        self.agent.state.stopped = True
        return True
    return False
```

### Windows File Lock Retry
```python
# WebuiManager config persistence
with self.config_lock:
    for attempt in range(3):
        try:
            IOManager.write_file_sync(path, json.dumps(config, indent=2))
            break
        except PermissionError:
            time.sleep(0.5)  # Windows file lock retry
```

---

## 9. Memory & Knowledge Management

### Site-Specific Knowledge (SimpleMemoryManager)
```python
# src/utils/memory_utils.py
class SimpleMemoryManager:
    """File-based site-specific knowledge storage."""
    
    def __init__(self, kb_dir="./tmp/memory"):
        self.kb_dir = kb_dir
    
    def _get_domain_file(self, url_or_domain):
        domain = urlparse(url_or_domain).netloc.replace("www.", "")
        safe_name = domain.replace(".", "_").replace(":", "_")
        return os.path.join(self.kb_dir, f"site_knowledge_{safe_name}.md")
    
    def save_site_knowledge(self, domain, knowledge):
        filepath = self._get_domain_file(domain)
        # Append with timestamp
        entry = f"\n---\n**{datetime.now().isoformat()}**\n{knowledge}\n"
        save_text_file(filepath, entry, mode="a")
    
    def get_site_knowledge(self, url):
        filepath = self._get_domain_file(url)
        if os.path.exists(filepath):
            return read_file_safe(filepath)
        return None
```

### Automatic Knowledge Injection on Domain Change
```python
# BrowserUseAgent._inject_site_knowledge()
async def _inject_site_knowledge(self):
    current_url = self.state.history.history[-1].state.url
    domain = urlparse(current_url).netloc.replace("www.", "")
    
    if domain != self.last_domain:  # Only on domain change
        self.last_domain = domain
        knowledge = self.memory_manager.get_site_knowledge(current_url)
        if knowledge:
            self.heuristics.inject_message(
                f"🧠 Memory Retrieval: Previous knowledge about {domain}:\n{knowledge}"
            )
```

### Auto-Learn Page Topic & Navigation
```python
# SystemActionsMixin.learn_page_topic_and_navigation
async def learn_page_topic_and_navigation(browser):
    page = await browser.get_current_page()
    
    # 1. Get metadata
    metadata = await page.evaluate(JS_GET_PAGE_METADATA)
    
    # 2. Get main content summary
    content = await page.evaluate(JS_GET_MAIN_CONTENT)
    summary = content[:500]
    
    # 3. Get navigation links (prioritize nav/header)
    links = await page.evaluate(JS_EXTRACT_LINKS)
    nav_links = [l for l in links if l.get('context') in ['nav', 'header']][:20]
    
    # 4. Construct and save
    knowledge_entry = (
        f"**Topic**: {metadata['title']}\n"
        f"**Description**: {metadata['description']}\n"
        f"**Summary**: {summary}\n"
        f"**Navigation**: {nav_summary}"
    )
    manager.save_site_knowledge(domain, knowledge_entry)
```

### Knowledge Base (File System)
```python
# src/utils/knowledge_base.py
def list_kb_files(kb_dir):
    """Recursively lists .md and .txt files."""
    files = []
    for root, dirs, filenames in os.walk(kb_dir):
        for f in filenames:
            if f.endswith(('.md', '.txt')):
                files.append(os.path.relpath(os.path.join(root, f), kb_dir))
    return files

def search_kb_files(kb_dir, query):
    """Searches file contents for query matches."""
    matches = []
    for filepath in list_kb_files(kb_dir):
        content = load_kb_content(kb_dir, filepath)
        if query.lower() in content.lower():
            matches.append(filepath)
    return matches
```

### LLM-Powered Knowledge Generation
```python
# src/webui/components/shared.py
async def generate_knowledge_suggestion(history: AgentHistoryList, llm: BaseChatModel):
    """Post-task: LLM analyzes agent history to suggest knowledge to save."""
    prompt = KNOWLEDGE_EXTRACTION_PROMPT.format(
        task=history.task,
        final_result=history.final_result(),
        steps_summary=format_history_summary(history)
    )
    response = await llm.ainvoke([
        SystemMessage(content="You are a knowledge extraction assistant."),
        HumanMessage(content=prompt)
    ])
    return response.content  # Suggested title + content for KB
```

### Brain File (External System Prompt)
```python
# Configurable markdown file as extended system prompt
brain_file = gr.Textbox(value="./brain.md")  # User-editable
# Content is loaded and prepended to system prompt at agent start
```

### Memory File (Agent Read/Write)
```python
# Persistent memory file for agent's working memory
memory_file = gr.Textbox(value="./tmp/memory/memory.txt")
# Agent can read/write procedural memory entries
# Site knowledge auto-saved to ./tmp/memory/site_knowledge_{domain}.md
```

### Deep Research Report Archival
```python
# DeepResearchStateManager.archive_report()
def archive_report(self, report, topic, memory_file):
    """Archives completed research reports to knowledge base."""
    filepath = save_to_knowledge_base_file(report, f"Research Report: {topic}", memory_file)
```

---

## 10. Task Orchestration & Planning

### Background Planner Loop
```python
# BrowserUseAgent._planner_loop()
async def _planner_loop(self):
    """Background asyncio task that periodically re-evaluates and updates the plan."""
    while not self.state.stopped:
        await asyncio.sleep(self.planner_interval)  # e.g., every 5 seconds
        
        if self.state.paused or self.is_validating:
            continue
        
        # 1. Gather context
        last_step = self.state.history.history[-1]
        plan_str = json.dumps(manager.bu_plan, indent=2)
        page_summary = last_step.state.element_tree[:4000]
        
        # 2. Ask planner LLM
        prompt = PLANNER_PROMPT.format(
            goal=self.task, plan=plan_str,
            last_thought=last_thought, page_summary=page_summary
        )
        response = await self.planner_llm.ainvoke([HumanMessage(content=prompt)])
        
        # 3. Apply plan modifications
        plan_update = json_repair.loads(response.content)
        if plan_update["action"] == "add":
            manager.add_plan_step(plan_update["step_description"])
        elif plan_update["action"] == "update":
            manager.update_plan_step_status(idx, status)
```

### Hierarchical Research Plan (Categories → Tasks)
```python
# DeepResearchState TypedDict
class DeepResearchState(TypedDict):
    topic: str
    research_plan: List[ResearchCategoryItem]  # Categories containing tasks
    search_results: List[Dict]
    current_category_index: int
    current_task_index_in_category: int
    final_report: Optional[str]

# TaskManager operations
task_manager = TaskManager(plan)
task_manager.add_task("New research task", category_index=0)
task_manager.add_subtasks(cat_idx, task_idx, ["Subtask 1", "Subtask 2"])
task_manager.renegotiate_plan(current_cat, current_task, new_plan)
task_manager.get_next_pending_task(current_cat, current_task)
```

### LangGraph State Machine (Deep Research)
```python
# 4-Node Research Workflow
# Node 1: planning_node
async def planning_node(state):
    """LLM generates hierarchical research plan as JSON."""
    response = await state["llm"].ainvoke([
        SystemMessage(content=DEEP_RESEARCH_PLANNING_PROMPT),
        HumanMessage(content=f"Research topic: {state['topic']}")
    ])
    plan = TaskManager.parse_plan_json(json.loads(response.content))
    return {"research_plan": plan}

# Node 2: research_execution_node
async def research_execution_node(state):
    """Executes current task using tool-bound LLM + browser agents."""
    task = task_manager.get_task(state["current_category_index"], state["current_task_index"])
    
    # Bind tools to LLM
    llm_with_tools = state["llm"].bind_tools(state["tools"])
    
    # Execute and collect results
    response = await llm_with_tools.ainvoke(messages)
    tool_results, tool_names, stop = await execute_tools(
        state["tools"], response.tool_calls, state["task_id"], state["search_results"]
    )
    return {"search_results": state["search_results"] + new_results}

# Conditional routing
def should_continue(state):
    if state["stop_requested"]: return "stop"
    if all_tasks_done(state): return "synthesize"
    return "continue"

# Node 3: synthesis_node
async def synthesis_node(state):
    """Generates final markdown report with APA citations from all search results."""
    response = await state["llm"].ainvoke([
        SystemMessage(content=DEEP_RESEARCH_SYNTHESIS_SYSTEM_PROMPT),
        HumanMessage(content=format_search_results(state["search_results"]))
    ])
    return {"final_report": response.content}

# Node 4: publish_node
async def publish_node(state):
    """Writes report to Google Docs via browser agent."""
    agent = await create_agent(task=f"Paste this into Google Docs: {state['final_report']}")
    await agent.run(max_steps=20)
```

### Parallel Browser Search Tool
```python
# src/agent/deep_research/search_tool.py
SEARCH_TOOL_DEFINITIONS = [
    {"name": "parallel_browser_search", "prompt_template": BROWSER_TASK_PROMPT},
    {"name": "academic_paper_search", "prompt_template": ACADEMIC_SEARCH_PROMPT},
    {"name": "youtube_search", "prompt_template": YOUTUBE_SEARCH_PROMPT},
]

async def _run_browser_search_tool(queries, task_id, llm, browser_config, ...):
    """Runs N browser agents in parallel for research."""
    task_factories = [partial(run_single_browser_task, q, ...) for q in queries]
    results = await run_tasks_in_parallel(task_factories, max_concurrent=max_parallel)
    return results

# Each search spawns a full BrowserUseAgent with 20 max steps and 120s timeout
async def run_single_browser_task(task_data, ...):
    browser = create_browser(config)
    context = await create_context(browser, config)
    agent = await create_agent(task=task_data, llm=llm, browser=browser)
    result = await asyncio.wait_for(agent.run(max_steps=20), timeout=120)
```

### Tool Execution with Concurrency
```python
# src/agent/deep_research/tool_executor.py
async def execute_tools(tools, tool_calls, task_id, search_results):
    """Executes tool calls concurrently with stop signal checking."""
    task_factories = [partial(_execute_single_tool, tc, tools, task_id) for tc in tool_calls]
    results = await run_tasks_in_parallel(task_factories, max_concurrent=10)
    
    # Aggregate results
    tool_messages = []
    for res in results:
        if res.get("stop_requested"): stop = True
        if res.get("tool_message"): tool_messages.append(res["tool_message"])
        if res.get("search_results"): search_results.extend(res["search_results"])
    
    return tool_messages, tool_names, stop
```

### Enhanced Agent Phased Execution
```python
# EnhancedDeepResearchAgent.run()
async def run(self, goal, initial_url, max_steps=15):
    # PHASE 1: DISCOVERY & PREREQUISITES
    pre_tasks = await self.discover_tasks(page, goal)
    for task in pre_tasks:
        await self._handle_prerequisite(page, task)
    
    # PHASE 1.5: DYNAMIC PLANNING
    subtasks = await self._extract_subtasks_from_page(page_content, goal)
    await self._add_subtasks_to_plan(subtasks)
    
    # PHASE 1.6: RUBRIC ANALYSIS
    rubric = await self._extract_rubric_constraints(page_content, goal)
    
    # PHASE 2: ACTION LOOP
    for step in range(max_steps):
        # 1. Analyze & Focus
        page_content, pagination, url = await self._analyze_page(page)
        await self._handle_focus(goal, page_content, page)
        
        # 2. Decide (LLM chooses action)
        decision = await self._decide_next_action(goal, page_content, ...)
        
        # 3. Execute (generic action dispatch)
        result = await self._execute_decision(decision, goal, url)
```

### Workflow Save/Load (Reusable Plans)
```python
# WebuiManager.workflow_manager
workflow_manager.save_workflow("research/news_scraper", plan_data)
workflow_manager.load_workflow("research/news_scraper")
workflow_manager.list_workflows()  # Supports folder organization
workflow_manager.delete_workflow("research/news_scraper")
```

### Session Resume (Agent History Persistence)
```python
# Agent history saved as JSON after each step
await agent.save_history_async(history_file)

# Resume: Load history and reconstruct agent state
async def handle_resume_session(webui_manager, history_file, components):
    history = AgentHistoryList.model_validate_json(IOManager.read_file_sync(history_file))
    # Reconstruct agent with loaded history
    agent = BrowserUseAgent(history=history, initial_actions=None, ...)
    await agent.run(max_steps=remaining_steps)
```

### Plan Step Actions (Pre-configured Actions)
```python
# Each plan step can have an associated action
plan_step = {
    "step": "Navigate to login page",
    "status": "pending",
    "action": "go_to_url",
    "params": {"url": "https://example.com/login"}
}

# Execute step action directly
async def handle_run_step_action(webui_manager, selected_step, components):
    step = get_step_by_selector(selected_step)
    if step.get("action"):
        result = await controller.execute_action_by_name(
            step["action"], step["params"], browser_context
        )
```

### AI Plan Generation & Optimization
```python
# Generate plan from task description
async def handle_generate_plan_from_prompt(webui_manager, prompt, components):
    llm = await initialize_llm(settings)
    response = await llm.ainvoke([HumanMessage(
        content=f"Generate a step-by-step plan for: {prompt}\nFormat as JSON array..."
    )])
    plan = parse_json_safe(response.content)

# Optimize existing plan with AI
async def handle_streamline_plan(webui_manager):
    llm = await initialize_llm(settings)
    response = await llm.ainvoke([HumanMessage(
        content=STREAMLINE_PLAN_PROMPT.format(plan=json.dumps(current_plan))
    )])
    optimized_plan = parse_json_safe(response.content)
```

---

## Appendix: Prompt Engineering Library

### Key Prompt Templates (from `src/utils/prompts.py`)

| Prompt | Purpose |
|--------|---------|
| `FULL_SYSTEM_PROMPT` | Massive system prompt with 26 instruction categories: quiz strategy (A-V-A-R method), homework mode, Yellowdig strategy, rubric analysis, ad handling, loop prevention |
| `DEFAULT_PLANNER_PROMPT` | Background planner LLM prompt for dynamic plan updates |
| `CONFIRMER_PROMPT_FAST` | Quick yes/no validation (strictness ≤ 3) |
| `CONFIRMER_PROMPT_STANDARD` | Detailed validation with configurable strictness (1-10) |
| `DEEP_RESEARCH_PLANNING_PROMPT` | Generates hierarchical research plan as JSON |
| `DEEP_RESEARCH_SYNTHESIS_SYSTEM_PROMPT` | Synthesizes search results into APA-cited report |
| `DEEP_RESEARCH_BROWSER_TASK_PROMPT` | Task prompt for parallel browser search agents |
| `DEEP_RESEARCH_ACADEMIC_SEARCH_PROMPT` | Academic paper search + citation extraction |
| `DEEP_RESEARCH_YOUTUBE_SEARCH_PROMPT` | YouTube transcript/summary extraction |
| `KNOWLEDGE_EXTRACTION_PROMPT` | Post-task knowledge suggestion from agent history |
| `ENHANCED_AGENT_FOCUS_PROMPT` | Smart positioning: what to focus on next |
| `ENHANCED_AGENT_ACTION_SYSTEM_PROMPT` | Action decision system prompt |
| `ENHANCED_AGENT_DISCOVERY_PROMPT` | Prerequisite task discovery |
| `SUBTASK_EXTRACTION_PROMPT` | Extract subtasks from page content |
| `RUBRIC_EXTRACTION_PROMPT` | Extract grading rubrics |
| `PAGE_LAYOUT_ANALYSIS_PROMPT` | LLM-powered page structure analysis |
| `STREAMLINE_PLAN_PROMPT` | AI plan optimization |

---

## Summary of Key Architectural Insights

1. **Layered Architecture**: Core (FastAPI) → Browser (Playwright) → Controller (Actions) → Agent (LLM reasoning) → WebUI (Gradio)
2. **Extension via Mixins**: Controller capabilities split across 6 mixins, easily extensible
3. **Multi-LLM Strategy**: 4 distinct LLM roles (Main, Planner, Confirmer, Priority cascade) with dynamic switching
4. **Browser-Agent Bidirectional Communication**: HUD overlay acts as real-time UI within the target page itself
5. **Resilience by Design**: Loop detection, model upgrading, timeout recovery, auto-save, navigation assessment
6. **Knowledge Accumulation**: Site-specific knowledge persists across sessions, auto-injected on domain revisit
7. **Dynamic Planning**: Plans are living documents—modified by planner loop, confirmer rejections, subtask extraction, and user edits
8. **Parallel Research**: Deep research spawns multiple browser agents concurrently with coordinated result synthesis
9. **LangGraph State Machine**: Research workflow uses formal state machine with conditional routing and persistence
10. **Human-in-the-Loop**: Agent can pause and request user input, user can control agent from browser HUD overlay
