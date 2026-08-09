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
import { ref, computed, inject, mergeProps } from 'vue';

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
// global pt injected once at app level (PrimeVue-style): app.provide('crGlobalPT', {...})
const globalPT = inject('crGlobalPT', {});

// resolve a section's pt from BOTH global and local, each of which may be a
// FUNCTION of live state — the reactive form the portable layer can't do.
function resolveSection(source, part) {
  const section = source && source[part];
  return typeof section === 'function' ? section({ active: active.value, part }) : section || {};
}
function sectionProps(part, base) {
  const g = resolveSection(globalPT, part);
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
