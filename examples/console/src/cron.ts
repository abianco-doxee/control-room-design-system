import cronstrue from "cronstrue";

/* cronstrue → readable text, with a graceful fallback for bad expressions. */
export function describeCron(expr: string): { text: string; bad: boolean } {
  try {
    return { text: cronstrue.toString(expr, { verbose: false }), bad: false };
  } catch (e) {
    return { text: "unrecognized cron expression", bad: true };
  }
}
