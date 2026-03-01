// Feature: DOM Actions | Why: Normalize planner actions into canonical verbs for stable execution

type RawStep = {
    action?: string;
    targetId?: string;
    value?: string;
    url?: string;
    text?: string;
    role?: string;
    name?: string;
    explanation?: string;
    knowledgeContext?: Record<string, unknown>;
};

type NormalizedStep = RawStep & {
    action: string;
    targetId?: string;
    value?: string;
};

const ACTION_ALIASES: Record<string, string> = {
    open_url: 'navigate',
    go_to_url: 'navigate',
    goto: 'navigate',
    visit: 'navigate',
    open: 'navigate',
    click_element: 'click',
    click_button: 'click',
    tap: 'click',
    select: 'click',
    enter_text: 'type',
    type_text: 'type',
    fill: 'type',
    input: 'type',
    wait_for_user: 'wait_for_user',
    ask_user: 'ask_user',
    scan_dom: 'scan_dom',
    record_knowledge: 'record_knowledge',
    lookup_documentation: 'lookup_documentation',
    verify: 'verify',
    extract_data: 'extract_data',
    interact: 'interact',
    wait: 'wait',
    done: 'done',
    click: 'click',
    type: 'type',
    navigate: 'navigate',
};

const normalizeAction = (action?: string): string => {
    const key = (action || '').trim().toLowerCase();
    return ACTION_ALIASES[key] || key;
};

export const normalizeStep = (step: RawStep): NormalizedStep => {
    const action = normalizeAction(step.action);
    const value = step.value ?? step.url ?? step.text;
    const targetId = step.targetId
        ?? (step as { target?: string }).target
        ?? (step as { selectorId?: string }).selectorId;
    return {
        ...step,
        action,
        ...(value ? { value } : {}),
        ...(targetId ? { targetId } : {}),
    };
};
