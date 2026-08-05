import { component$, useStore, useComputed$, useOnDocument, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { describeCron } from "../cron";

/* Consume the Mitosis-compiled Qwik components straight from the built barrel.
 * (In a downstream app this is `@control-room/design-system/qwik`.)
 *
 * Note: the compiled components expose plain prop names (`onClick`, `onChange`,
 * `onClose`) — NOT the `$`-suffixed DOM form. Pass a QRL under the plain name:
 * `onClick={$(() => …)}`. That's the one integration wrinkle worth knowing. */
import {
  CrButton,
  CrSwitch,
  CrModal,
  CrShape,
  CrSigil,
  CrChip,
  CrTable,
  CrTabs,
  CrMeter,
  CrMenu,
  CrPagination,
  CrToastRegion,
  CrKbd,
  CrKeyHints,
  CrPalette,
  CrAlert,
  CrRadioGroup,
  CrSlider,
  CrProgress,
  CrAccordion,
  CrPopover,
  CrDrawer,
  CrBreadcrumb,
  CrSegmented,
  CrCombobox,
  CrNumberField,
  CrHoverCard,
  CrTree,
  CrDateTime,
  CrCronField,
} from "../../../../dist/frameworks/qwik";

type Sev = "crit" | "warn" | "work" | "ok" | "idle";
type State = "working" | "waiting" | "idle" | "error" | "done";

interface Session {
  id: string;
  task: string;
  status: string;
  state: State;
  severity: Sev;
  tag: string; // canonical cr-tag tone
}

const SESSIONS: Session[] = [
  { id: "nova-01", task: "chat-turn stream", status: "streaming", state: "working", severity: "work", tag: "work" },
  { id: "ptl-757", task: "needs your input", status: "waiting 4m", state: "waiting", severity: "warn", tag: "wait" },
  { id: "cr-1130", task: "build failing", status: "SSE closed · 3/5", state: "error", severity: "crit", tag: "err" },
  { id: "rp-verify", task: "merged to main", status: "done", state: "done", severity: "ok", tag: "done" },
  { id: "ail-chat", task: "idle worker", status: "parked", state: "idle", severity: "idle", tag: "idle" },
];

const THEMES = ["dark", "light", "extreme", "phosphor"] as const;

export default component$(() => {
  const ui = useStore({ theme: "dark", modal: false, page: 1, palette: false, density: "cozy", refresh: 30, drawer: false, scope: "all", worker: "", retries: 5, cron: "0 2 * * *", startAt: "" });

  const FLEET = [
    {
      id: "nova",
      label: "nova (pool)",
      children: [
        { id: "nova-01", label: "nova-01 · streaming" },
        { id: "nova-02", label: "nova-02 · idle" },
      ],
    },
    {
      id: "ail",
      label: "ail (pool)",
      children: [
        { id: "ail-chat", label: "ail-chat · waiting" },
        { id: "rp-verify", label: "rp-verify · done" },
      ],
    },
  ];
  const live = useStore<Record<string, boolean>>({ "nova-01": true, "ptl-757": false });
  const toasts = useStore<{ list: { id: number; signal: string; message: string }[]; seq: number }>({
    list: [],
    seq: 0,
  });

  const pushToast = $((signal: string, message: string) => {
    toasts.seq = toasts.seq + 1;
    toasts.list = [...toasts.list, { id: toasts.seq, signal, message }];
  });
  const dismissToast = $((id: number | string) => {
    toasts.list = toasts.list.filter((t) => t.id !== id);
  });

  const COMMANDS = [
    { id: "incident", label: "Open incident", hint: "I", group: "action" },
    { id: "notify", label: "Notify: queue drained", hint: "N", group: "action" },
    { id: "restart", label: "Restart failed jobs", group: "action" },
    { id: "theme:dark", label: "Theme: Dark", hint: "1", group: "theme" },
    { id: "theme:light", label: "Theme: Light", hint: "2", group: "theme" },
    { id: "theme:extreme", label: "Theme: Extreme", hint: "3", group: "theme" },
    { id: "theme:phosphor", label: "Theme: Phosphor", hint: "4", group: "theme" },
  ];

  /* cronstrue translation, recomputed reactively when ui.cron changes */
  const cronDesc = useComputed$(() => describeCron(ui.cron));

  const runCommand = $((id: string) => {
    ui.palette = false;
    if (id === "incident") ui.modal = true;
    else if (id === "notify") {
      toasts.seq = toasts.seq + 1;
      toasts.list = [...toasts.list, { id: toasts.seq, signal: "done", message: "queue drained" }];
    } else if (id === "restart") {
      toasts.seq = toasts.seq + 1;
      toasts.list = [...toasts.list, { id: toasts.seq, signal: "work", message: "restarting failed jobs" }];
    } else if (id.indexOf("theme:") === 0) {
      const t = id.slice(6);
      ui.theme = t;
      document.documentElement.setAttribute("data-theme", t);
    }
  });

  /* App-level keyboard shortcuts. Ignored while typing in a field. Hold Alt to
   * peek every key-hint badge (CrKeyHints, mounted below). */
  useOnDocument(
    "keydown",
    $((e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      /* ⌘K / Ctrl+K toggles the command palette — even from a field */
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui.palette = !ui.palette;
        return;
      }
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "i") {
        ui.modal = true;
      } else if (e.key === "n") {
        toasts.seq = toasts.seq + 1;
        toasts.list = [...toasts.list, { id: toasts.seq, signal: "done", message: "queue drained" }];
      } else if (e.key >= "1" && e.key <= "4") {
        const t = THEMES[Number(e.key) - 1];
        ui.theme = t;
        document.documentElement.setAttribute("data-theme", t);
      }
    }),
  );

  const setTheme = $((t: string) => {
    ui.theme = t;
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("cr-theme", t);
    } catch (e) {
      /* ignore */
    }
  });

  return (
    <div class="cr-instrument" style="min-height:100vh;display:grid;grid-template-columns:auto 1fr;gap:0">
      {/* ── nav rail ─────────────────────────────────────────────── */}
      <nav class="cr-nav" style="min-width:170px">
        <a class="cr-nav__item cr-nav__item--active" href="#">
          Sessions <span class="cr-nav__badge">14</span>
        </a>
        <a class="cr-nav__item" href="#">Queue <span class="cr-nav__badge">2</span></a>
        <a class="cr-nav__item" href="#">Instruments</a>
        <a class="cr-nav__item" href="#">Logs</a>
        <a class="cr-nav__item" href="#">Settings</a>
      </nav>

      {/* ── board ────────────────────────────────────────────────── */}
      <div style="padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-5)">
        <CrBreadcrumb
          items={[
            { label: "control room", href: "#" },
            { label: "sessions", href: "#" },
            { label: "cr-1130" },
          ]}
        />

        <header class="cr-masthead cr-mark">
          <p class="cr-masthead__eyebrow">DP Control Room · Phase 0</p>
          <h1 class="cr-masthead__title">14 sessions<br />2 need you</h1>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);flex-wrap:wrap;align-items:center">
            <span class="cr-tag cr-tag--wait">2 waiting</span>
            <span class="cr-tag cr-tag--err">1 failing</span>
            <CrHoverCard label="health" title="Fleet health">
              <dl class="cr-dl">
                <dt class="cr-dl__k">workers</dt><dd class="cr-dl__v">4 online</dd>
                <dt class="cr-dl__k">throughput</dt><dd class="cr-dl__v">128 turns/min</dd>
                <dt class="cr-dl__k">error rate</dt><dd class="cr-dl__v">1.2%</dd>
              </dl>
            </CrHoverCard>
            <CrButton size="sm" emphasis="outline" keyshortcuts="Meta+K Control+K" onClick={$(() => (ui.palette = true))}>
              commands
              <CrKbd keys="⌘K" />
            </CrButton>
            <CrPopover label="filters ▾" title="Queue filters">
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">show state</p>
              <div style="display:flex;flex-direction:column;gap:var(--space-1)">
                <label style="font-family:var(--font-mono);font-size:var(--text-sm);display:flex;gap:var(--space-2);align-items:center"><input type="checkbox" class="cr-check" checked /> failing</label>
                <label style="font-family:var(--font-mono);font-size:var(--text-sm);display:flex;gap:var(--space-2);align-items:center"><input type="checkbox" class="cr-check" checked /> waiting</label>
                <label style="font-family:var(--font-mono);font-size:var(--text-sm);display:flex;gap:var(--space-2);align-items:center"><input type="checkbox" class="cr-check" /> idle</label>
              </div>
            </CrPopover>
            <CrMenu
              label="actions ▾"
              items={[
                { label: "pause all" },
                { label: "restart failed" },
                { label: "kill all", danger: true },
              ]}
              onSelect={$((i: number) =>
                pushToast(
                  i === 2 ? "err" : "work",
                  ["paused all workers", "restarting failed jobs", "killed all workers"][i],
                ),
              )}
            />
            <span style="flex:1"></span>
            <div class="cr-keys-host" style="display:flex;gap:var(--space-2);align-items:center">
              {THEMES.map((t, i) => (
                <CrButton
                  key={t}
                  emphasis={ui.theme === t ? "solid" : "outline"}
                  signal={ui.theme === t ? "accent" : undefined}
                  size="sm"
                  onClick={$(() => setTheme(t))}
                >
                  {t}
                  <CrKbd keys={String(i + 1)} hint on={ui.theme === t} />
                </CrButton>
              ))}
            </div>
          </div>
        </header>

        <CrAlert
          signal="wait"
          title="Scheduled maintenance"
          message="Workers restart at 02:00 UTC — in-flight jobs will resume automatically."
          dismissible
        />

        {/* the one item that needs attention — the sanctioned Breach (Law 9) */}
        <div class="cr-breach cr-breach--err cr-breach--alive" style="padding:var(--space-4)">
          <div style="position:relative;z-index:1">
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <CrShape severity="crit" label="critical" />
              <strong style="font-family:var(--font-display);font-size:var(--text-lg);text-transform:uppercase;letter-spacing:-.02em">
                cr-1130 build failing
              </strong>
            </div>
            <p style="font-family:var(--font-mono);font-size:var(--text-sm);margin:var(--space-2) 0 var(--space-3)">
              SSE closed · retry 3/5 · last green 41m ago
            </p>
            <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
              <CrButton signal="err" keyshortcuts="i" onClick={$(() => (ui.modal = true))}>
                open incident
                <CrKbd keys="I" on />
              </CrButton>
              <CrButton emphasis="outline" onClick={$(() => (ui.drawer = true))}>inspect ▸</CrButton>
            </div>
          </div>
        </div>

        {/* session grid */}
        <section
          class="cr-panel cr-panel--major"
          style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)"
        >
          <h2 style="font-family:var(--font-display);text-transform:uppercase;font-size:var(--text-md);margin:0">
            Live sessions
          </h2>
          {SESSIONS.map((s) => (
            <div key={s.id} class="cr-row" style="display:flex;align-items:center;gap:var(--space-3)">
              <CrSigil seed={s.id} state={s.state} size={40} />
              <CrShape severity={s.severity} label={s.severity} />
              <div style="flex:1;min-width:0">
                <div style="font-family:var(--font-mono);font-weight:700">{s.id}</div>
                <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--muted)">
                  {s.task}
                </div>
              </div>
              <span class={"cr-tag cr-tag--" + s.tag}>{s.status}</span>
              <CrSwitch
                checked={!!live[s.id]}
                label="live"
                onChange={$((v: boolean) => (live[s.id] = v))}
              />
            </div>
          ))}
        </section>

        {/* queue: tabs + a sortable / selectable table + capacity meters */}
        <section class="cr-panel" style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
          <CrTabs tabs={["queue", "workers", "history"]} />
          <div style="max-height:220px;overflow:auto">
            <CrTable
              sortable
              selectable
              sticky
              columns={["job", "worker", "age", "state"]}
              rows={[
                ["cr-1130", "nova-01", "41m", "failing"],
                ["ptl-757", "ail-chat", "4m", "waiting"],
                ["rp-verify", "nova-02", "12m", "done"],
                ["dx-880", "nova-01", "2m", "working"],
                ["qz-3", "ail-chat", "58m", "idle"],
              ]}
            />
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            <CrMeter label="cpu" value={72} signal="work" />
            <CrMeter label="queue" value={40} signal="wait" />
            <CrMeter label="errors" value={12} signal="err" />
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
            <CrPagination page={ui.page} total={9} onChange={$((p: number) => (ui.page = p))} />
            <span style="flex:1"></span>
            <CrButton size="sm" emphasis="outline" keyshortcuts="n" onClick={$(() => pushToast("done", "queue drained"))}>
              notify
              <CrKbd keys="N" />
            </CrButton>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4);align-items:start">
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">density</p>
              <CrRadioGroup
                label="Row density"
                value={ui.density}
                row
                options={[
                  { value: "cozy", label: "cozy" },
                  { value: "compact", label: "compact" },
                ]}
                onChange={$((v: string) => (ui.density = v))}
              />
            </div>
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">refresh · {ui.refresh}s</p>
              <CrSlider value={ui.refresh} min={5} max={120} step={5} label="Refresh interval seconds" onChange={$((v: number) => (ui.refresh = v))} />
            </div>
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">indexing</p>
              <CrProgress value={64} label="Indexing 64%" />
              <div style="height:var(--space-2)"></div>
              <CrProgress indeterminate signal="wait" label="Syncing" />
            </div>
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">scope</p>
              <CrSegmented
                label="Queue scope"
                value={ui.scope}
                options={[
                  { value: "all", label: "all" },
                  { value: "mine", label: "mine" },
                  { value: "failing", label: "failing" },
                ]}
                onChange={$((v: string) => (ui.scope = v))}
              />
            </div>
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">jump to worker</p>
              <CrCombobox
                placeholder="worker…"
                value={ui.worker}
                options={[
                  { value: "nova-01", label: "nova-01" },
                  { value: "nova-02", label: "nova-02" },
                  { value: "ail-chat", label: "ail-chat" },
                  { value: "rp-verify", label: "rp-verify" },
                ]}
                onChange={$((v: string) => (ui.worker = v))}
              />
            </div>
            <div>
              <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">max retries</p>
              <CrNumberField value={ui.retries} min={0} max={10} label="Max retries" onChange={$((v: number) => (ui.retries = v))} />
            </div>
          </div>
        </section>

        {/* maintenance schedule — cron (translated live by cronstrue) + a start time */}
        <section class="cr-panel" style="padding:var(--space-4);display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-4);align-items:start">
          <div>
            <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">restart schedule (cron)</p>
            <CrCronField
              value={ui.cron}
              description={cronDesc.value.text}
              invalid={cronDesc.value.bad}
              onChange={$((v: string) => (ui.cron = v))}
              presets={[
                { label: "hourly", cron: "0 * * * *" },
                { label: "nightly 2am", cron: "0 2 * * *" },
                { label: "weekdays 9am", cron: "0 9 * * 1-5" },
                { label: "every 15m", cron: "*/15 * * * *" },
              ]}
            />
          </div>
          <div>
            <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 var(--space-2)">first run at</p>
            <CrDateTime value={ui.startAt} label="First run" onChange={$((v: string) => (ui.startAt = v))} />
          </div>
        </section>

        <footer style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
          <CrChip tone="done">v1.0.0</CrChip>
          <span class="cr-telemetry">SYS 0x7F · 41ms · ▁▂▃▅▇▅▃▂</span>
          <span style="flex:1"></span>
          <span class="cr-ruler" style="width:180px"></span>
        </footer>
      </div>

      <CrDrawer open={ui.drawer} side="right" title="cr-1130 · inspect" onClose={$(() => (ui.drawer = false))}>
        {/* dot-leader rows (ascii "·····" between key and value) */}
        <div style="display:flex;flex-direction:column;gap:var(--space-1)">
          <div class="cr-leader"><span class="cr-leader__k">worker</span><span class="cr-leader__fill"></span><span class="cr-leader__v">nova-01</span></div>
          <div class="cr-leader"><span class="cr-leader__k">region</span><span class="cr-leader__fill"></span><span class="cr-leader__v">eu-west-1</span></div>
          <div class="cr-leader"><span class="cr-leader__k">retries</span><span class="cr-leader__fill"></span><span class="cr-leader__v">3 / 5</span></div>
        </div>

        <p class="cr-sep-label">fleet</p>
        <CrTree label="Worker fleet" nodes={FLEET} defaultExpanded={["nova"]} />

        <p class="cr-sep-label">recent events</p>
        {/* ascii-marker list */}
        <ul class="cr-list cr-list--tick">
          <li class="cr-list__item">12:03 stream opened</li>
          <li class="cr-list__item">12:07 stall detected</li>
          <li class="cr-list__item">12:41 SSE closed · retry 3/5</li>
        </ul>

        <p class="cr-sep-label">diagnostics</p>
        <CrAccordion
          single
          defaultOpen={[0]}
          items={[
            { title: "Stack trace", body: "SSEError: stream closed at turn 42 · reconnect backoff exhausted" },
            { title: "Recent events", body: "12:03 open · 12:07 stall · 12:41 SSE closed · retry 3/5" },
            { title: "Config", body: "model=opus · timeout=30s · maxRetries=5 · region=eu-west-1" },
          ]}
        />
      </CrDrawer>

      {/* hold Alt to peek every secondary key-hint badge */}
      <CrKeyHints />
      <CrPalette
        open={ui.palette}
        commands={COMMANDS}
        placeholder="Type a command… (↑↓ to move, ↵ to run)"
        onRun={runCommand}
        onClose={$(() => (ui.palette = false))}
      />
      <CrToastRegion position="br" toasts={toasts.list} onDismiss={dismissToast} />

      <CrModal open={ui.modal} title="Incident · cr-1130" onClose={$(() => (ui.modal = false))}>
        <p style="font-family:var(--font-mono);font-size:var(--text-sm)">
          Build failing on <strong>cr-1130</strong>. The SSE connection closed and
          3 of 5 retries have elapsed. Escalate or restart the worker.
        </p>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">
          <CrButton signal="err" onClick={$(() => (ui.modal = false))}>restart worker</CrButton>
          <CrButton emphasis="outline" onClick={$(() => (ui.modal = false))}>dismiss</CrButton>
        </div>
      </CrModal>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Control Room — Console",
  meta: [{ name: "description", content: "A Qwik dashboard built on Control Room." }],
};
