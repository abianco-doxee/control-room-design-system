import { component$, useStore, useOnDocument, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

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
  const ui = useStore({ theme: "dark", modal: false, page: 1 });
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

  /* App-level keyboard shortcuts. Ignored while typing in a field. Hold Alt to
   * peek every key-hint badge (CrKeyHints, mounted below). */
  useOnDocument(
    "keydown",
    $((e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
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
        <header class="cr-masthead cr-mark">
          <p class="cr-masthead__eyebrow">DP Control Room · Phase 0</p>
          <h1 class="cr-masthead__title">14 sessions<br />2 need you</h1>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);flex-wrap:wrap;align-items:center">
            <span class="cr-tag cr-tag--wait">2 waiting</span>
            <span class="cr-tag cr-tag--err">1 failing</span>
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
                  kind={ui.theme === t ? "accent" : "controls"}
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
            <CrButton kind="err" keyshortcuts="i" onClick={$(() => (ui.modal = true))}>
              open incident
              <CrKbd keys="I" on />
            </CrButton>
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
            <CrMeter label="cpu" value={72} tone="work" />
            <CrMeter label="queue" value={40} tone="wait" />
            <CrMeter label="errors" value={12} tone="err" />
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
            <CrPagination page={ui.page} total={9} onChange={$((p: number) => (ui.page = p))} />
            <span style="flex:1"></span>
            <CrButton size="sm" kind="controls" keyshortcuts="n" onClick={$(() => pushToast("done", "queue drained"))}>
              notify
              <CrKbd keys="N" />
            </CrButton>
          </div>
        </section>

        <footer style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
          <CrChip tone="done">v1.0.0</CrChip>
          <span class="cr-telemetry">SYS 0x7F · 41ms · ▁▂▃▅▇▅▃▂</span>
          <span style="flex:1"></span>
          <span class="cr-ruler" style="width:180px"></span>
        </footer>
      </div>

      {/* hold Alt to peek every secondary key-hint badge */}
      <CrKeyHints />
      <CrToastRegion position="br" toasts={toasts.list} onDismiss={dismissToast} />

      <CrModal open={ui.modal} title="Incident · cr-1130" onClose={$(() => (ui.modal = false))}>
        <p style="font-family:var(--font-mono);font-size:var(--text-sm)">
          Build failing on <strong>cr-1130</strong>. The SSE connection closed and
          3 of 5 retries have elapsed. Escalate or restart the worker.
        </p>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">
          <CrButton kind="err" onClick={$(() => (ui.modal = false))}>restart worker</CrButton>
          <CrButton kind="controls" onClick={$(() => (ui.modal = false))}>dismiss</CrButton>
        </div>
      </CrModal>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Control Room — Console",
  meta: [{ name: "description", content: "A Qwik dashboard built on Control Room." }],
};
