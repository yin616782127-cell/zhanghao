# WorkBuddy Upgrade Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity interactive desktop-hosted mobile demo for the WorkBuddy channel-to-project upgrade flow, with original and optimized variants.

**Architecture:** A Vite React single-page application renders a fixed 390 × 844 phone viewport inside a responsive desktop review shell. A pure reducer owns the six-step flow so both visual variants consume identical state and can switch without losing context.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, ESLint, CSS.

## Global Constraints

- The phone product viewport is exactly `390 × 844`.
- The demo includes `original` and `optimized` variants with shared state.
- The six steps are `onboarding`, `selection`, `confirmation`, `progress`, `result`, and `project`.
- Simulated progress finishes deterministically in 3–5 seconds.
- No real backend or cross-refresh persistence.
- System Chinese fonts are used; visual tokens live in CSS variables.
- `npm test`, `npm run build`, and `npm run lint` must pass.

---

## File Structure

- `package.json`: scripts and dependencies.
- `vite.config.ts`: Vite and Vitest configuration.
- `eslint.config.js`: TypeScript/React lint configuration.
- `index.html`: application mount point.
- `src/main.tsx`: React bootstrap.
- `src/App.tsx`: demo shell orchestration.
- `src/demo/types.ts`: flow and data types.
- `src/demo/demoMachine.ts`: pure reducer and selectors.
- `src/demo/demoMachine.test.ts`: reducer behavior tests.
- `src/demo/demoData.ts`: deterministic channel and project fixtures.
- `src/components/DemoShell.tsx`: review toolbar and phone frame.
- `src/components/PhoneChrome.tsx`: status bar and Home Indicator.
- `src/components/screens/*.tsx`: six focused flow screens.
- `src/styles/tokens.css`: visual tokens.
- `src/styles/app.css`: responsive shell, screen and animation styles.
- `src/App.test.tsx`: full-flow interaction test.

---

### Task 1: Project scaffold and flow state machine

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `src/demo/types.ts`
- Create: `src/demo/demoData.ts`
- Create: `src/demo/demoMachine.ts`
- Test: `src/demo/demoMachine.test.ts`

**Interfaces:**
- Produces: `DemoState`, `DemoAction`, `demoReducer`, `initialDemoState`, `canContinue`, `selectedChannels`.
- Consumes: no application code.

- [ ] **Step 1: Install the latest React/Vite/test dependencies with npm and add scripts**

Scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest run",
  "lint": "eslint ."
}
```

- [ ] **Step 2: Write failing reducer tests**

```ts
it("does not advance from selection without a selected channel", () => {
  const state = { ...initialDemoState, step: "selection" as const };
  expect(demoReducer(state, { type: "NEXT" }).step).toBe("selection");
});

it("keeps the current step when switching visual variants", () => {
  const state = { ...initialDemoState, step: "confirmation" as const };
  expect(demoReducer(state, { type: "SET_VARIANT", variant: "optimized" })).toMatchObject({
    step: "confirmation",
    variant: "optimized",
  });
});

it("reset restores the complete initial flow", () => {
  const dirty = {
    ...initialDemoState,
    step: "result" as const,
    selectedChannelIds: ["design"],
    progress: 100,
  };
  expect(demoReducer(dirty, { type: "RESET" })).toEqual(initialDemoState);
});
```

- [ ] **Step 3: Run reducer tests and verify the missing-module failure**

Run: `npm test -- src/demo/demoMachine.test.ts`

Expected: FAIL because `demoMachine.ts` exports do not exist.

- [ ] **Step 4: Implement the minimal typed reducer**

The reducer must support:

```ts
type DemoAction =
  | { type: "SET_VARIANT"; variant: DemoVariant }
  | { type: "GO_TO"; step: DemoStep }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "TOGGLE_CHANNEL"; channelId: string }
  | { type: "RENAME_PROJECT"; channelId: string; name: string }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_PARTIAL_FAILURE"; enabled: boolean }
  | { type: "RESET" };
```

- [ ] **Step 5: Run reducer tests**

Run: `npm test -- src/demo/demoMachine.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json eslint.config.js index.html src/demo
git commit -m "feat: scaffold WorkBuddy demo state machine"
```

---

### Task 2: Review shell and original flow

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/DemoShell.tsx`
- Create: `src/components/PhoneChrome.tsx`
- Create: `src/components/screens/OnboardingScreen.tsx`
- Create: `src/components/screens/ChannelSelectionScreen.tsx`
- Create: `src/components/screens/UpgradeConfirmationScreen.tsx`
- Create: `src/components/screens/UpgradeProgressScreen.tsx`
- Create: `src/components/screens/UpgradeResultScreen.tsx`
- Create: `src/components/screens/ProjectHomeScreen.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: reducer and fixtures from Task 1.
- Produces: fully navigable `App`, screen components with semantic labels and buttons.

- [ ] **Step 1: Write a failing full-flow test**

```tsx
it("completes the original channel upgrade flow", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "立即体验" }));
  await userEvent.click(screen.getByRole("checkbox", { name: "产品设计讨论" }));
  await userEvent.click(screen.getByRole("button", { name: "下一步" }));
  await userEvent.click(screen.getByRole("button", { name: "确认升级" }));
  expect(await screen.findByText("升级完成")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "进入项目" }));
  expect(screen.getByText("产品设计项目")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify it fails because App is missing**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL with missing `App` module or missing controls.

- [ ] **Step 3: Implement the desktop shell and phone chrome**

Required shell controls:

```tsx
<button aria-pressed={variant === "original"}>原稿版</button>
<button aria-pressed={variant === "optimized"}>优化版</button>
<button onClick={goBack}>上一步</button>
<button onClick={reset}>重新演示</button>
```

- [ ] **Step 4: Implement all six original screens with semantic interactions**

Each screen receives only the state slice and callbacks it needs. Progress uses a `setInterval` that dispatches `SET_PROGRESS`; reaching `100` dispatches `GO_TO` with `result`.

- [ ] **Step 5: Add high-fidelity CSS for 390 × 844**

Use a neutral desktop background, rounded phone shell, system status bar, white product surfaces, black primary buttons and the source design's teal accent.

- [ ] **Step 6: Run the full-flow test**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: build original WorkBuddy upgrade flow"
```

---

### Task 3: Optimized variant and comparison behavior

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/screens/*.tsx`
- Modify: `src/styles/app.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `DemoState.variant`.
- Produces: optimized copy, hierarchy and progress feedback without changing business state.

- [ ] **Step 1: Write failing variant tests**

```tsx
it("preserves the current flow step while switching variants", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "立即体验" }));
  expect(screen.getByText("选择要升级的频道")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "优化版" }));
  expect(screen.getByText("选择要升级的频道")).toBeInTheDocument();
  expect(screen.getByText("消息、成员、资料和任务都会保留")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the variant test and verify the optimized message is absent**

Run: `npm test -- src/App.test.tsx -t "preserves"`

Expected: FAIL on the optimized helper text assertion.

- [ ] **Step 3: Implement optimized content and hierarchy**

Optimized mode must:

- explain what is preserved;
- show selected count next to the primary action;
- show migration categories on confirmation;
- show stage labels during progress;
- show explicit success/failure counts on result.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add optimized upgrade demo variant"
```

---

### Task 4: Visual polish, accessibility, and release verification

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/components/**/*.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed demo.
- Produces: responsive review build and documented run commands.

- [ ] **Step 1: Add responsive scaling and reduced-motion support**

```css
@media (max-height: 940px) {
  .phone-stage { transform: scale(0.88); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Add focus-visible styles and accessible labels**

All icon-only controls receive `aria-label`; keyboard focus uses a visible teal outline.

- [ ] **Step 3: Document local usage**

README commands:

```bash
npm install
npm run dev
npm test
npm run build
```

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```bash
git add README.md src
git commit -m "chore: polish and document WorkBuddy demo"
```
