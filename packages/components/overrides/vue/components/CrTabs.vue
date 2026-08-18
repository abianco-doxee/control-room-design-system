<template>
  <!-- HAND-WRITTEN Vue override (overrides/vue/components/CrTabs.vue).
       Replaces the Mitosis-generated Vue CrTabs to demonstrate FULL native pt:
       function-form pt reactive to internal state, Vue mergeProps listener
       CHAINING (consumer onClick runs *and* selection still fires), and global
       pt via inject — none of which the portable single-source layer can do.
       Cost: this file is now hand-maintained and diverges from CrTabs.lite.tsx. -->
  <div v-bind="rootAttrs" role="tablist" data-part="root" :style="dt" @keydown="onKey">
    <button
      v-for="(tab, i) in tabs"
      :key="i"
      v-bind="tabAttrs(i)"
      type="button"
      role="tab"
      data-part="tab"
      :data-state="active === i ? 'active' : 'inactive'"
      :id="id ? `${id}-tab-${i}` : undefined"
      :aria-controls="id ? `${id}-panel-${i}` : undefined"
      :aria-selected="active === i ? 'true' : 'false'"
      :tabindex="active === i ? 0 : -1"
      @click="select(i)"
    >
      {{ tab }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, inject, mergeProps, onMounted, onUpdated, onUnmounted } from 'vue';
// Sibling import: this file is copied to dist/frameworks/vue/components/CrTabs.vue,
// so the context is beside it — the same specifier the generated components use.
import CrContext from './cr.context';

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  active: { type: Number, default: 0 },
  id: { type: String, default: undefined },
  unstyled: { type: Boolean, default: false },
  pt: { type: [Object, Function], default: () => ({}) },
  dt: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['change']);

const active = ref(props.active || 0);

// The app-level tier comes from the SAME context every generated component uses —
// `CrContext.key`, a Symbol. This file previously injected a string key
// ('crGlobalPT'), which meant an app providing the documented context configured
// all 80 components EXCEPT this one, and an app configuring this one reached
// nothing else. Two incompatible global tiers, silently.
const cr = inject(CrContext.key, undefined);
const globalPT = computed(() => (cr && cr.pt && cr.pt.CrTabs) || {});

// PT lifecycle hooks, resolved through the same cascade (global then instance) as
// the generated components — see ptHooks/ptResolve in lib/pt.ts.
function hooks() {
  const g = globalPT.value && globalPT.value.hooks;
  const l = typeof props.pt === 'object' && props.pt ? props.pt.hooks : undefined;
  return { ...(g || {}), ...(l || {}) };
}
onMounted(() => { const h = hooks(); if (h.onMounted) h.onMounted(); });
onUpdated(() => { const h = hooks(); if (h.onUpdated) h.onUpdated(); });
onUnmounted(() => { const h = hooks(); if (h.onUnmounted) h.onUnmounted(); });

// resolve a section's pt from BOTH global and local, each of which may be a
// FUNCTION of live state — the reactive form the portable layer can't do.
function resolveSection(source, part) {
  const section = source && source[part];
  return typeof section === 'function' ? section({ active: active.value, part }) : section || {};
}
function sectionProps(part, base) {
  const g = resolveSection(globalPT.value, part);
  const l = resolveSection(props.pt, part);
  const cls = props.unstyled ? '' : base;
  // Vue mergeProps: concatenates class, merges style, and CHAINS listeners.
  return mergeProps({ class: cls }, g, l);
}
const rootAttrs = computed(() => sectionProps('root', 'cr-tabs'));
function tabAttrs(i) {
  const base = 'cr-tab' + (active.value === i ? ' cr-tab--on' : '');
  return sectionProps('tab', base);
}

function select(i) {
  active.value = i;
  emit('change', i);
}
function onKey(e) {
  const el = document.activeElement;
  const list = el ? el.closest('[role="tablist"]') : null;
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const i = tabs.indexOf(el);
  let next = -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = tabs.length - 1;
  if (next >= 0) { e.preventDefault(); select(next); tabs[next].focus(); }
}
</script>
