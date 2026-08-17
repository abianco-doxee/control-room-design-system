/* Built-in English UI copy — the strings `Intl` cannot derive.
 *
 * The localisation model has exactly two sources and no third:
 *
 *   1. Anything Intl can derive (month/weekday names, dates, numbers, relative
 *      time) comes from `Intl` keyed on the resolved locale. No table, every
 *      locale works on day one.
 *   2. Everything else — the accessible names and visible labels below — ships as
 *      English defaults here and is overridable through the same cascade as `pt`.
 *
 * Resolution for one key (see resolveMessage in lib/pt.ts):
 *
 *   props.labels[key]  →  context messages["<Component>.<key>"]  →  the default here
 *
 * Same precedence as `pt`, so the whole library has one mental model. Keys are
 * flat per component (`labels={{ close: "Chiudi" }}`) and namespaced in the global
 * map (`messages={{ "CrModal.close": "Chiudi" }}`).
 *
 * A value may be a plain string or a function of one argument for the counted /
 * interpolated cases (`page`, `digit`, `removeTag`, …) — a function keeps word
 * order under the caller's control, which concatenation cannot do across
 * languages. */

export type CrMessage = string | ((value: any) => string);

export const CR_MESSAGES: Record<string, Record<string, CrMessage>> = {
  CrAlert: { dismiss: "Dismiss" },
  CrCalendar: {
    prevMonth: "Previous month",
    nextMonth: "Next month",
    month: "Month",
    year: "Year",
  },
  CrCarousel: {
    prevSlide: "Previous slide",
    nextSlide: "Next slide",
    goToSlide: (n: any) => "Go to slide " + n,
  },
  CrDataGrid: { selectAllRows: "Select all rows", selectRow: "Select row" },
  CrDrawer: { close: "Close" },
  CrInput: { clear: "Clear" },
  CrModal: { close: "Close" },
  CrNav: { primary: "Primary" },
  CrNumberField: { decrease: "Decrease", increase: "Increase" },
  CrOverflow: {
    /* Both take the noun so a translation can put it where its grammar needs it. */
    showMore: (o: any) => "show " + o.count + " more " + o.noun,
    showFewer: (o: any) => "show fewer " + o.noun,
    more: (n: any) => "+" + n + " more",
    less: "show less",
  },
  CrPagination: {
    pagination: "Pagination",
    prevPage: "Previous page",
    nextPage: "Next page",
    page: (n: any) => "Page " + n,
  },
  CrPalette: {
    commandPalette: "Command palette",
    searchCommands: "Search commands",
    commands: "Commands",
  },
  CrPinInput: { digit: (n: any) => "Digit " + n },
  CrResizable: { resize: "Resize panels" },
  CrTable: { select: "select", selectRow: "select row" },
  CrTagsInput: { removeTag: (t: any) => "Remove " + t },
  CrToast: { dismiss: "Dismiss" },
  CrToastRegion: { dismiss: "Dismiss" },
};
