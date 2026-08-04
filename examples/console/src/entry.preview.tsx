/* Preview entry — a Node server that serves the SSR build for `npm run preview`. */
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";

export default createQwikCity({ render, qwikCityPlan });
