import { useEffect, useReducer } from "react";
import { DemoShell } from "./components/DemoShell";
import { ChannelSelectionScreen } from "./components/screens/ChannelSelectionScreen";
import { OnboardingScreen } from "./components/screens/OnboardingScreen";
import { ProjectHomeScreen } from "./components/screens/ProjectHomeScreen";
import { UpgradeConfirmationScreen } from "./components/screens/UpgradeConfirmationScreen";
import { UpgradeProgressScreen } from "./components/screens/UpgradeProgressScreen";
import { UpgradeResultScreen } from "./components/screens/UpgradeResultScreen";
import { demoReducer, initialDemoState } from "./demo/demoMachine";
import "./styles/tokens.css";
import "./styles/app.css";

export default function App() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);

  useEffect(() => {
    if (state.step !== "progress") return;

    const timer = window.setInterval(() => {
      if (state.progress >= 100) {
        window.clearInterval(timer);
        dispatch({ type: "GO_TO", step: "result" });
        return;
      }

      const next = Math.min(state.progress + 20, 100);
      dispatch({ type: "SET_PROGRESS", progress: next });
      if (next === 100) {
        window.clearInterval(timer);
        dispatch({ type: "GO_TO", step: "result" });
      }
    }, 550);

    return () => window.clearInterval(timer);
  }, [state.step, state.progress]);

  const goToProgress = () => {
    dispatch({ type: "SET_PROGRESS", progress: 0 });
    dispatch({ type: "GO_TO", step: "progress" });
  };

  const screen = (() => {
    switch (state.step) {
      case "onboarding":
        return (
          <OnboardingScreen
            variant={state.variant}
            onStart={() => dispatch({ type: "GO_TO", step: "selection" })}
          />
        );
      case "selection":
        return (
          <ChannelSelectionScreen
            variant={state.variant}
            selectedIds={state.selectedChannelIds}
            onToggle={(channelId) => dispatch({ type: "TOGGLE_CHANNEL", channelId })}
            onContinue={() => dispatch({ type: "NEXT" })}
            onBack={() => dispatch({ type: "BACK" })}
          />
        );
      case "confirmation":
        return (
          <UpgradeConfirmationScreen
            variant={state.variant}
            selectedIds={state.selectedChannelIds}
            projectNames={state.projectNames}
            onRename={(channelId, name) =>
              dispatch({ type: "RENAME_PROJECT", channelId, name })
            }
            onConfirm={goToProgress}
            onBack={() => dispatch({ type: "BACK" })}
          />
        );
      case "progress":
        return (
          <UpgradeProgressScreen
            variant={state.variant}
            progress={state.progress}
            selectedCount={state.selectedChannelIds.length}
            onBack={() => dispatch({ type: "BACK" })}
          />
        );
      case "result":
        return (
          <UpgradeResultScreen
            variant={state.variant}
            selectedIds={state.selectedChannelIds}
            partialFailure={state.partialFailure}
            onEnterProject={() => dispatch({ type: "GO_TO", step: "project" })}
            onRetry={goToProgress}
          />
        );
      case "project":
        return (
          <ProjectHomeScreen
            variant={state.variant}
            selectedIds={state.selectedChannelIds}
            onBack={() => dispatch({ type: "BACK" })}
          />
        );
    }
  })();

  return (
    <DemoShell
      variant={state.variant}
      step={state.step}
      partialFailure={state.partialFailure}
      onVariantChange={(variant) => dispatch({ type: "SET_VARIANT", variant })}
      onPartialFailureChange={(enabled) =>
        dispatch({ type: "SET_PARTIAL_FAILURE", enabled })
      }
      onBack={() => dispatch({ type: "BACK" })}
      onReset={() => dispatch({ type: "RESET" })}
    >
      {screen}
    </DemoShell>
  );
}
