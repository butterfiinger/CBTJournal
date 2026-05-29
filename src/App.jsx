import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Capture from './pages/Capture';
import LogGoodMoment from './pages/LogGoodMoment';
import Bank from './pages/Bank';
import ProcessQueue from './pages/ProcessQueue';
import ProcessChat from './pages/ProcessChat';
import Patterns from './pages/Patterns';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Reprogramming from './pages/Reprogramming';
import ReprogramSession from './pages/ReprogramSession';
import HomeScreenPrompt from './components/HomeScreenPrompt';
import TabBar from './components/TabBar';

const ONBOARDING_KEY = 'emotional_processing_onboarded';
const HOME_SCREEN_PROMPT_KEY = 'home_screen_prompt_seen';

// Detect if we should show the home screen prompt:
// - User is on iOS Safari (where Add to Home Screen makes sense)
// - App is NOT already running in standalone mode (they haven't saved it yet)
function shouldShowHomeScreenPrompt() {
  // Already seen and dismissed the prompt? Don't show again.
  if (localStorage.getItem(HOME_SCREEN_PROMPT_KEY)) return false;

  // Already running as standalone PWA? They've already saved it.
  if (window.matchMedia('(display-mode: standalone)').matches) return false;
  if (window.navigator.standalone === true) return false;

  // Check if iOS Safari
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

  return isIOS && isSafari;
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHomeScreenPrompt, setShowHomeScreenPrompt] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded) {
      setShowOnboarding(true);
    }
    setHasChecked(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);

    // After onboarding completes, check if we should prompt to save to home screen
    if (shouldShowHomeScreenPrompt()) {
      // Small delay so the transition feels natural — onboarding fades, then prompt appears
      setTimeout(() => setShowHomeScreenPrompt(true), 300);
    }
  };

  const dismissHomeScreenPrompt = () => {
    localStorage.setItem(HOME_SCREEN_PROMPT_KEY, 'true');
    setShowHomeScreenPrompt(false);
  };

  // Don't render anything until we've checked localStorage to avoid flash
  if (!hasChecked) return null;

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/process" element={<ProcessQueue />} />
        <Route path="/process/:entryId" element={<ProcessChat />} />
        <Route path="/log-good-moment" element={<LogGoodMoment />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="/reprogram" element={<Reprogramming />} />
        <Route path="/reprogram/:woundId" element={<ReprogramSession />} />
        <Route path="/settings" element={<Settings onReplayOnboarding={() => setShowOnboarding(true)} />} />
      </Routes>
      <TabBar />
      {showHomeScreenPrompt && <HomeScreenPrompt onDismiss={dismissHomeScreenPrompt} />}
    </div>
  );
}

export default App;
