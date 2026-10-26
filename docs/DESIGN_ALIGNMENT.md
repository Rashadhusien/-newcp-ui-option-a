# DESIGN_ALIGNMENT: New CP UI Option A (A16, analysis only)

Date: 27 Oct 2026. Branch: `docs/fe-a-a16-design-alignment`. No code was changed.
Sources (read-only, local, git-ignored under `refrences/`; the folder name is spelled that way on disk):

| Ref | Path | What it is |
|---|---|---|
| **DS** | `refrences/newcp-design-system/` (not `docs/design-system/`) | New CP design system: `README.md`, `tokens.json`, `pages.md`, `states.md`, `endpoints.md`, `components/*/README.md` + `preview.html` (22 components). Generated on 26 Oct from this repo's theme, so its tokens equal ours (section 3). |
| **CANVAS** | `refrences/New CP Screens.html` | Bundled design canvas (needs a local HTTP server to render): 16 boards, every New CP page in its states, desktop and phone, light and dark. This is the visual target. |
| **POC-1** | `refrences/1-mui/` (`cp-poc-mui`) | Earlier 3DDX CP proof of concept: legacy CP pages (dashboard, orders, cases, doctors, clinics...). Our A1 bootstrap came from this code base. Palette "Radiology Indigo & Ice", IBM Plex fonts. |
| **POC-2** | `refrences/mui/` (`cp-poc-mui`) | The earlier page-based variant of the same POC (`src/pages`, `src/layout`), same indigo palette and IBM Plex. |

**Data check:** no real patient, doctor, clinic or customer data was found. `1-mui/src/data/seed/*.json` (patients, doctors, clinics, scan centers) holds realistic-looking records with fictional `555` phone numbers, and both POCs state "invented names" (`src/data/names.ts`, `CLAUDE.md`). None of it is quoted or copied here; treat those files as off-limits for our mocks anyway.

**Main finding.** The gap is **not** in the tokens: DS tokens and `src/theme/tokens.ts` are the same values (one dark shadow differs). The visible difference is **layout and components**: the CANVAS puts the evidence badge in the page header, uses a segmented theme control, labels above fields, titled cards, a transition bar, tabs on the service page and centred state panels. The POCs use a different palette and font; we do **not** adopt them (section 6).

---

## 1. Inventory of the reference design

### 1.1 App shell, sidebar, header
| Element | Reference behaviour | Source |
|---|---|---|
| Shell | Header 64 px over content; content max 1440, padding 24 (16 below 1024); canvas background `canvas`, panels on `surface` | DS `components/AppShell/README.md`; DS `tokens.json` layout; CANVAS "Shell, navigation, settings, 404" |
| Sidebar desktop (>= 1024) | 260 px, brand row "New CP" (64 px), groups WORKSPACE (Report, Orders, Models, Conversion) and SYSTEM (Settings); active item: `selected` fill, primary text, heavier weight, `aria-current="page"` | DS AppShell; CANVAS "Report: loaded (light)"; POC-1 `src/components/layout/Sidebar.tsx`, `navigation.tsx` |
| Sidebar tablet (641-1023) | 72 px icon rail, tooltips | CANVAS "Shell..." board "TABLET, RAIL" |
| Sidebar phone | Temporary drawer from a header menu button, max 82 vw, close button with brand | CANVAS "PHONE, DRAWER OPEN"; POC-2 `src/layout/Sidebar.tsx`, `useSidebarState.ts` |
| Header desktop | No menu toggle; right side: segmented theme control (Light / Dark / System) and avatar menu (name, "Signed in", Sign out) | CANVAS "Report: loaded"; POC-2 `src/components/ThemeModeSwitch.tsx` (ToggleButtonGroup) |
| Header phone | Menu button, brand, MOCK badge, avatar | CANVAS "Report: phone", "Service instance: phone" |
| Brand mark | DS: `MedicalServices` icon on a primary square + "New CP"; CANVAS draws a tooth outline | DS README "Iconography"; CANVAS (conflict, section 6) |

### 1.2 Page templates
| Template | Structure | Source |
|---|---|---|
| List page (Report, Order services) | PageHeader (h1 22/28, one-line description, actions right: EvidenceBadge first, then buttons) -> bordered card with toolbar (search, selects) -> count line -> status count chips per service type -> table (mono IDs) -> footer "1 to 8 of 14" + Rows per page + Previous/Next | DS `PageHeader`, `TableToolbar`, `StatusCounts`, `DataTable`; CANVAS "Report: loaded", "Order services list" |
| Detail page (Service instance) | Header: title "Biomodel" + mono service ID, meta line (order, client, patient), right: StatusBadge, Rush tag, MOCK -> TransitionBar card "Move this service to" -> tabs Details / Pricing and billing / History -> two cards side by side (Pricing, Bill To) -> History card -> footer note "Saving sends the ETag with If-Match." + Discard / Save changes | CANVAS "Service instance (A7R, A8R)"; DS `TransitionBar`, `PriceFields`, `BillToField`, `HistoryTimeline` |
| Form page (create/edit) | PageHeader + MOCK -> one card with sections ("Case details", "Staff fields"), two/three-column grid, labels above fields, conditional fields indented with a primary left rule and "Shown because ..." note -> Cancel / Create service right-aligned | CANVAS "New Biomodel service", "Edit Conversion service"; DS `TextField`, `Select`, `ChoiceControls`, `ErrorSummary` |
| Auth page | Split: primary brand panel (left) + sign-in card on `canvas` (right); card: title, MOCK badge, description, primary "Sign in with Google", info alert, outlined "Start demo session", legal note | CANVAS "Sign in", "Sign in: states" |
| State panel | Centred: icon in a tinted circle, title, one sentence, one outlined action ("Back to report", "Go to report") | CANVAS "Order services list" (404 board), "Service instance: states", "Shell... 404"; DS `ErrorState`, `EmptyState` |
| States boards | Loading skeletons, empty, error with request ID, 403 read-only banner, 409/412/428 banners, invoiced lock, hold reasons loading/empty, transition in flight | CANVAS "* : states" boards; DS `states.md` |

### 1.3 Spacing and density
- 4 px grid; card padding 20; gap between cards 24; form row gap 16; table cell padding 12 horizontal; dense table rows (~36-40 px), 13 px cells, 12 px uppercase headers on `surface-subtle` (DS `tokens.json`, `DataTable/README.md`).
- Controls 40 px high, 44 px under 768 (DS `touch-min`, `field-height`).
- Flat, bordered cards; shadows only on menus, dialogs, toasts (DS README "Flat and bordered").

### 1.4 Components used (reference -> path)
| Component | DS spec | CANVAS board | POC code (visual source only) |
|---|---|---|---|
| AppShell / Sidebar / Header | `components/AppShell` | Shell | POC-1 `src/components/layout/*`; POC-2 `src/layout/*` |
| Theme control (segmented) | AppShell (header) | Shell "THEME CONTROL" | POC-2 `src/components/ThemeModeSwitch.tsx` |
| PageHeader (actions, meta) | `components/PageHeader` | all pages | POC-1 `src/components/layout/PageHeader.tsx`; POC-2 `src/components/PageHeader.tsx` |
| EvidenceBadge (MOCK, INTEGRATED, BLOCKED) | `components/EvidenceBadge` | all data pages | ours |
| Button | `components/Button` | all | ours (`AppButton`) |
| TextField / Select / ChoiceControls | `components/TextField`, `Select`, `ChoiceControls` | forms | ours |
| DataTable (+ cards on phone) | `components/DataTable` | Report, Order services | ours (`ResponsiveDataTable`) |
| TableToolbar | `components/TableToolbar` | Report | ours |
| StatusCounts | `components/StatusCounts` | Report | ours |
| StatusBadge | `components/StatusBadge` | everywhere | ours |
| DetailList | `components/DetailList` | Service instance | ours |
| SectionCard (titled card) | (implied by every board) | Service instance, forms | POC-1 `src/components/data-display/SectionCard.tsx`, `Panel.tsx` |
| SectionTabs | (CANVAS only) | Service instance | POC-1 `src/components/data-display/SectionTabs.tsx` |
| TransitionBar | `components/TransitionBar` (Proposed) | Service instance (+ phone, stacked) | POC-2 `src/components/ActionPanel.tsx`, `src/pages/orderDetails/ServiceAction.tsx` |
| HoldDialog | `components/HoldDialog` (Proposed) | Service instance: states | ours |
| PriceFields | `components/PriceFields` (Proposed) | Service instance | ours (`StaffFieldsForm`) |
| BillToField | `components/BillToField` (Proposed) | Service instance | none (cut, D-55) |
| HistoryTimeline | `components/HistoryTimeline` | Service instance | POC-2 `src/components/Timeline.tsx` |
| StaleBanner (409/412/428) | `components/StaleBanner` | states boards | ours (inline Alerts) |
| ErrorSummary | `components/ErrorSummary` | Service form: states | ours |
| ErrorState / EmptyState / LoadingState | `components/ErrorState`, `EmptyState`, `LoadingState` | states boards | ours |
| InlineAlert / Toast / ConfirmDialog | `components/InlineAlert`, `Toast`, `ConfirmDialog` | various | ours |

---

## 2. Gap table: current vs reference

Type: **L** layout, **C** component, **T** token.

| Page | Gap (current -> reference) | Type |
|---|---|---|
| **Shell** | Menu toggle always shown -> hidden at >= 1024 (persistent sidebar), shown on tablet/phone | L |
| | Theme as an icon menu -> segmented Light / Dark / System control (icon + label) | C |
| | MOCK badge in the header on every page -> in the PageHeader actions (desktop); header only on phone | L |
| | Tenant badge (IAM v0.9.7) is not in the CANVAS (it predates IAM) -> keep it, beside the avatar | L (keep ours) |
| | `@fontsource/outfit` imported in `src/main.tsx` but no typography uses it -> remove (DS: Inter + JetBrains Mono only) | T |
| **Sign-in** | Title + radio list of mock identities + "Sign in (mock)" -> card: title + MOCK badge + description, primary "Sign in with Google" (disabled/BLOCKED in our build), info alert, then the mock identity choice and "Start demo session" (outlined) | L, C |
| | Brand panel present (ours) -> same; legal note under the card missing | L |
| **Pending Access** | Not in the CANVAS -> use the CANVAS state-panel pattern (icon circle, title, sentence, "Check again" outlined + "Sign out" text) on the auth layout | C |
| **Report** | Toolbar and chips already match closely; MOCK in header -> PageHeader actions; footer pager: Previous/Next with arrows and "1 to 8 of 14" | L, C |
| | Provisional fixture columns (client, patient code, due, priority) are what the CANVAS shows; they stay provisional (A5R cut) | - |
| **Orders** | `/orders` = order services list (A7R); "Order services" title -> "Order" + mono order reference + meta line; **we have no order number, client or patient fields in the contract (Q-B3)**, so the header shows the order UUID short form and a MOCK note | L |
| **Order services list** | Columns Line / Status / Instance ID / Line total -> Service ID (mono) / Type / Status (+ Invoiced tag) / Quantity / Billable / Bill To / Due + row action "Open ->"; Bill To and Due need data we do not show (Bill To cut; no due date field) -> show Quantity, Billable, Invoiced; Bill To column only when A8R returns | L, C |
| | Info alert "Two Biomodel services on this order are two separate instances..." above the table (ours puts it in the description) | L |
| | Header actions "+ New Biomodel" (primary), "+ New Conversion" (outlined) missing (they live on the Models/Conversion launchers) | L |
| | Empty and 404 boards: centred state panel | C |
| **Service detail** | Title "Biomodel service, line 1" -> "Biomodel" + mono service ID; meta line; StatusBadge + MOCK right in the header | L |
| | Status buttons inside the "Status" card -> **TransitionBar** card at the top: "Move this service to", first non-hold move `primary`, others outlined, hold outlined with icon; helper "Buttons come from the API list..."; phone: stacked full width | C, L |
| | Three stacked sections -> **tabs** Details / Pricing and billing / History | C, L |
| | Staff fields as a form only -> **PriceFields** card: read-only DetailList (quantity, catalog unit price, override, final total, currency "Read-only") above the inputs; Billable as Yes/No select; footer "Saving sends the ETag with If-Match." + Discard + Save changes | C |
| | Bill To card (CANVAS) -> not built (cut, D-55) | C (cut) |
| | History as `ActivityFeed` with generic icons -> **HistoryTimeline**: numbered/tone-dot list, status name bold + time + actor; hold events show hold type badge and reason. Actor names are not in the contract (Q-B6) -> "Actor not shown" | C |
| | On Hold dialog: submit enabled, errors after submit -> primary disabled until type + reason set; "Demo only" tag next to the Reason label; note "Type and reason are sent in the same request as the transition." | C |
| | 409/412/428 inline alerts -> **StaleBanner** variants with Reload button and request ID | C |
| | Read-only (403) -> warning banner "You can view this service but not change it. Transition buttons are hidden." | C |
| | Invoiced -> lock banner "This service is invoiced. Price and billing fields are read-only." with disabled fields | C |
| | Labels inside fields (MUI floating) -> labels above fields | C, T (theme) |
| **Service create/edit form** | Labels inside fields -> labels above, two/three-column grid at desktop | C, L |
| | Sections as separate blocks -> one card with section titles ("Case details", "Staff fields") | L |
| | Conditional field: not marked -> primary left rule + "Shown because the answer above is Yes" caption | C |
| | MOCK evidence as an info alert inside the form -> MOCK badge in PageHeader + one caption under the fields | L |
| | Staff fields on create (quantity, Billable, unit price, currency read-only, rush read-only, Redo of, internal comment) -> ours sends quantity 1 only; Redo/notes are cut (D-55) | L (cut) |
| | Footer buttons left/right mix -> right-aligned Cancel (outlined) + primary last; stacked on phone, primary on top | L |
| **No access / Not available / 404** | `ErrorState` plain -> centred state panel (icon in tinted circle) + one outlined action back to the report | C |

---

## 3. Token mapping: DS -> `src/theme/tokens.ts`

Method: every value in `refrences/newcp-design-system/tokens.json` was compared with `src/theme/tokens.ts` by script (whitespace-insensitive).

| Group | DS tokens | Our tokens | Result |
|---|---|---|---|
| Colour (light + dark) | 57 colour tokens: canvas, surface, surface-elevated/overlay/subtle, border, divider, input-border, text*, on-primary, primary, primary-hover, primary-tint, secondary, semantic + *-bg/*-fg, hover, selected, row-hover, focus, scroll-thumb*, chart-* | `colorTokens`, `statusBadgeTokens`, `tableTokens`, `focusTokens`, `scrollbarTokens`, `chartTokens` | **All 114 values present.** Two DS names have no named slot in ours: `primary-hover` dark (`#93C5F5`, only inside `statusBadgeTokens.primary.dark.text`) and `on-primary` dark (`#0A0F17`, equals `background.dark`). |
| Typography | Inter / JetBrains Mono; page-title 22/28 600, section-title 16/24 600, card-title 14/20 600, kpi 24/32, body 14/20, body-strong, secondary 13/18, caption 12/16, button 14/20 500, table-header 12/16 600 0.06em, table-cell 13/18, mono 14/20 | `typographyTokens` (same sizes, families, weights, tracking) | Equal. `main.tsx` also loads Outfit 600, unused. |
| Spacing | space-1..6, 8, 12 = 4, 8, 12, 16, 20, 24, 32, 48 | `spacingTokens.scale` = 4, 8, 12, 16, 24, 32, 48 (20 only as `cardPadding`) | 20 missing from the scale. |
| Radius | xs 4, sm 6, md 8, lg 12, xl 16 | `radiusTokens` same | Equal. |
| Elevation | shadow-sm/md/lg, light + dark | `shadowTokens` sm, md, lg, mdDark, lgDark | `shadow-sm` dark (`0 1px 2px 0 rgba(0,0,0,0.35)`) missing. |
| Layout | sidebar 260, rail 72, header 64, content 1440, pad 16/24, card 20, grid gap 24, touch 44, field 40 | `layoutTokens`, `spacingTokens`, `touchTargetTokens` | Equal except `field-height` 40 has no token (MUI default sizes are used). |
| Breakpoints | 640, 1024, 1280, 1536 | `breakpointTokens` same | Equal. |
| Motion | **not defined in DS** | none (MUI defaults; `prefers-reduced-motion` handled in CssBaseline) | Gap in both. |
| Z-index | **not defined in DS** | none (MUI defaults) | Gap in both. |

**Exact token changes proposed for A16a** (all literals stay in `tokens.ts`; `check-tokens` keeps passing):
1. `colorTokens.primary.darkHover = '#93C5F5'` (DS `primary-hover` dark); `colorTokens.text.onFillDark = '#0A0F17'` (DS `on-primary` dark). Palette wiring in `palette.ts` reads them instead of re-using other keys.
2. `spacingTokens.scale` -> `[4, 8, 12, 16, 20, 24, 32, 48]` (DS space-5). Nothing in `src/` reads `scale` today (checked), so no index shift.
3. `shadowTokens.smDark = '0 1px 2px 0 rgb(0 0 0 / 0.35)'`.
4. `layoutTokens.fieldHeight = 40`; theme sets `MuiOutlinedInput` min height from it (44 under 768 already comes from `touchTargetTokens`).
5. **New, no DS source** (marked `DEMO_ONLY_APPROVED` once you approve): `motionTokens = { durationShort: 150, durationStandard: 200, durationLong: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }` wired into `theme.transitions`; `zIndexTokens` = MUI defaults written down (appBar 1100, drawer 1200, modal 1300, snackbar 1400, tooltip 1500) so components stop relying on implicit values. Add both to the DS as a follow-up so the two stay equal.
6. Remove the unused `@fontsource/outfit` import from `src/main.tsx` (the dependency itself can be removed later with your approval; removal only, no addition).

No colour value changes. Light and dark both keep their current, contrast-checked values.

---

## 4. Component plan

All in our stack (MUI + our folders); no new dependency.

| # | Component | Change | Where | Hours |
|---|---|---|---|---|
| 1 | `ThemeModeSwitch` | New: segmented Light/Dark/System (MUI ToggleButtonGroup), replaces the header icon menu; reused on Settings | `shared/components/basic` | 0.25 |
| 2 | `Header` / `AppShell` | Menu toggle only below 1024; EvidenceBadge out of the header on desktop; tenant badge kept | `shared/components/layout` | 0.25 |
| 3 | `PageHeader` | Add `actions`, `meta` (mono ID, status, tags) and `evidence` slot | `shared/components/layout` | 0.25 |
| 4 | `SectionCard` | New: titled bordered card (h2 section-title, optional action), replaces ad-hoc `Paper` sections | `shared/components/data-display` | 0.25 |
| 5 | `SectionTabs` | New: MUI Tabs bar for detail pages, URL-synced tab, scrolls on phone | `shared/components/data-display` | 0.25 |
| 6 | `TransitionBar` | New: extracted from `StatusPanel`; primary first move, outlined rest, stacked on phone, in-flight state | `features/services/detail` | 0.5 |
| 7 | `HistoryTimeline` | New: tone dot per destination status, hold badge, degrade rules; replaces `ActivityFeed` use | `features/services/detail` | 0.5 |
| 8 | `StaffFieldsForm` -> `PriceFields` | Restyle: read-only summary above inputs, Billable Yes/No select, Discard + Save footer with If-Match note, lock and read-only banners | `features/services/detail` | 0.5 |
| 9 | `HoldDialog` | Submit disabled until complete, "Demo only" tag on the label, note line | `features/services/detail` | 0.25 |
| 10 | `StaleBanner` | New shared banner for 409/412/428 (Reload, request ID); used by detail and form | `shared/components/feedback` | 0.25 |
| 11 | `AppTextField` / `AppSelect` (+ theme) | Labels above the control (static `InputLabel`, no notch), required asterisk `aria-hidden`, read-only dashed style | `shared/components/basic`, `theme/components/data.ts` | 0.75 |
| 12 | `ErrorState` / `EmptyState` | Centred state panel with tinted icon circle and one action | `shared/components/feedback` | 0.25 |
| 13 | `DetailList` | Em dash with `aria-label="Not set"`, mono values, stack at <= 640 | `shared/components/data-display` | 0.25 |
| 14 | `AuthLayout` sign-in card | Card variant with MOCK badge, Google button (BLOCKED), info alert, demo session block, legal note | `shared/components/layout`, `features/auth` | 0.25 |
| 15 | `EvidenceBadge` BLOCKED | New variant (needed only when Bill To returns) | `shared/components/feedback` | 0.25 (with A8R) |

---

## 5. Staged proposal

Every stage ends with `npm run verify` green, a browser check at 390 and 1440 (light; dark only where the stage touches colour), and its own PR. Tests that query by label/role keep working because labels and roles do not change; snapshot-free tests mean low test churn.

| Stage | Scope | Components (section 4) | Hours | Risk | If time runs short |
|---|---|---|---|---|---|
| **A16a** Theme and tokens | Token changes 1-6 (section 3); theme reads them | - | **0.5** | Low: no colour values change; `scale` has no readers | Skip motion/z-index tokens (5) |
| **A16b** Shell and navigation | Header and sidebar behaviour, segmented theme switch, EvidenceBadge into PageHeader, PageHeader slots, SectionCard | 1, 2, 3, 4 | **1.25** | Medium: header used by every page; mobile drawer and rail must keep working | Keep the icon theme menu (drop 1) |
| **A16c-1** Service detail (also fixes the flaky On Hold test, D-63) | Header with mono ID + status + MOCK, TransitionBar, tabs, PriceFields, HistoryTimeline, HoldDialog polish, StaleBanner, lock/read-only banners | 5, 6, 7, 8, 9, 10 | **2.0** | Medium: the A7R tests (6) touch this page; keep labels and button names | Drop tabs (keep stacked SectionCards) -0.25; drop HistoryTimeline tone dots -0.25 |
| **A16c-2** Order services list | Order header, info alert, new columns (Quantity, Billable, Invoiced tag), row "Open" action, New Biomodel/Conversion actions, state panels | 12, 13 | **0.75** | Low | Skip header actions |
| **A16c-3** Service create/edit form | Labels above fields (theme), grid, one card with section titles, conditional rule styling, footer | 11 | **1.0** | Medium-high: labels-above touches every field and the A6R tests | Keep floating labels; only regroup into one card (-0.5) |
| **A16c-4** Report | MOCK into PageHeader, pager style | - | **0.25** | Low | Skip |
| **A16c-5** Sign-in, Pending, No access, 404 | Sign-in card, state panels | 12, 14 | **0.5** | Low | Skip Pending/404 polish |
| **Total** | | | **6.25 h** | | |

**Order by demo impact:** A16a -> A16b -> A16c-1 (service detail is the core of the demo) -> A16c-2 -> A16c-3 -> A16c-5 -> A16c-4.

**Cut items relative to these stages** (my recommendation):
1. **Bill To UI (A8R, 1 h)** right after **A16c-1**: the CANVAS service page has a Bill To card, the IAM spec lists a live Bill To scenario (M03/M04), and A16c-1 already builds the card slot and the BLOCKED badge.
2. **Redo / pending reason / notes (0.5 h)** after **A16c-3**: they live in the PriceFields/form layout, so build them once the new form layout exists.
3. **Report re-key (A5R, 0.5 h)** last, after **A16c-4**: invisible in a demo unless someone inspects the data; the report already looks like the CANVAS.

**Budget per stage** (for your decision): A16a 0.5 h, A16b 1.25 h, A16c-1 2.0 h, A16c-2 0.75 h, A16c-3 1.0 h, A16c-4 0.25 h, A16c-5 0.5 h; plus A8R 1.0 h, Redo/pending/notes 0.5 h, A5R 0.5 h. Minimum meaningful set before Tuesday night: **A16a + A16b + A16c-1 = 3.75 h**.

---

## 6. Conflicts with CLAUDE.md or the approved stack

| Conflict | Reference | What we do instead |
|---|---|---|
| Different palette ("Radiology Indigo & Ice", primary `#4056A1`) and fonts (IBM Plex Sans/Mono) | POC-1 `src/theme/tokens.ts`, `src/theme/fonts.ts`; POC-2 `src/theme/tokens.ts` | Keep the DS/CANVAS X-ray blue + Inter/JetBrains Mono (= our tokens). Do not add `@fontsource/ibm-plex-*`. |
| Libraries not in our approved stack: `@mui/x-data-grid`, `@mui/x-charts`, `react-odontogram`, `date-fns` | POC-1/POC-2 `package.json`; used in `src/components/DataTable/*`, `charts/*`, `TeethChart*`, `utils/format.ts`, `pages/reports/*` | Keep `ResponsiveDataTable` (MUI Table + cards), no charts (no demo chart), no teeth chart (out of scope), `dayjs` for dates. |
| Out-of-scope shell features: global search, notifications, breadcrumbs, data-status bar, support widget, role switcher | POC-1 `src/components/layout/GlobalSearch.tsx`, `NotificationsMenu.tsx`, `AppBreadcrumbs.tsx`, `DataStatusBar.tsx`, `src/support/*`, `src/auth/RoleContext.tsx` | Not imported (already removed in A1). Roles come only from the session context (IAM v0.9.7). |
| Fields the contract does not have: order number, client, patient code, due date, rush value, catalog vs override price, history actor names, a "Request information" transition | CANVAS "Order services list", "Service instance", "Report" | Show only contract fields; label missing ones `[NEEDS VERIFICATION]` / "Not in the API contract" (Q-B2, Q-B3, Q-B6). Transitions only from `available-transitions`. |
| CANVAS predates IAM v0.9.7: no tenant badge, no Pending Access, "Sign in with Google" + "Start demo session" instead of our identity picker | CANVAS "Sign in", "Shell" | Keep the read-only tenant badge and Pending Access (IAM wins); put the mock identity choice inside the CANVAS card under "Start demo session"; Google button shows BLOCKED. |
| Brand mark: tooth outline (CANVAS) vs `MedicalServices` on a primary square (DS rule "do not redraw 3D Diagnostix marks") | CANVAS all boards; DS README "Iconography" | Follow the DS rule (written decision), keep `MedicalServices`. |
| Avatar initials from a real name ("RH") and actor "Rashad" in history | CANVAS boards | Use the session `displayName` (synthetic in mock) only. |
| Bill To card on the service page | CANVAS "Service instance (A7R, A8R)" | Not built (D-55) until you restore A8R; MOCK/BLOCKED rules unchanged. |
| R14 (MUI vs Tailwind) still open | CLAUDE.md, G2 | Unchanged: all of this is MUI; nothing here needs Tailwind. |

**Draft DEVIATIONS entries** (to add when A16a starts; not added now):
- **D-59 Design alignment source (A16).** The visual target is the CANVAS `refrences/New CP Screens.html` and the DS `refrences/newcp-design-system/` (generated from this repo's theme; tokens equal). The two POCs (`refrences/1-mui`, `refrences/mui`) are a layout source only: their indigo palette, IBM Plex fonts, x-data-grid, x-charts, react-odontogram and date-fns are not adopted. Path differs from the request (`docs/design-system/` does not exist).
- **D-60 Token additions without a DS source.** Motion and z-index tokens are written down from MUI defaults (no DS value exists); `primary.darkHover`, `text.onFillDark`, `shadowTokens.smDark`, `fieldHeight` and spacing 20 mirror the DS. The DS should be updated to include motion and z-index.
- **D-61 CANVAS fields not in the contract.** Order number, client, patient code, due date, rush value, catalog price, actor names and the "Request information" transition appear in the CANVAS but not in the reference OpenAPI; they are not shown (or are labelled "Not in the API contract") until Q-B2, Q-B3 and Q-B6 are answered.
- **D-62 IAM overrides the CANVAS.** The tenant badge, Pending Access and the mock identity picker (IAM v0.9.7) are kept although the CANVAS has none; the brand mark follows the DS rule, not the CANVAS tooth drawing.

## Open questions
- **G14 (Aya):** confirm the CANVAS + DS (X-ray blue, Inter) is the target, not the POC indigo/IBM Plex look.
- **G15 (Aya):** approve motion and z-index tokens taken from MUI defaults (no DS source).
- **G16 (you):** available hours before Tuesday night, and whether Bill To (A8R) comes back after A16c-1.
