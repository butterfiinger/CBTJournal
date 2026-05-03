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
import TabBar from './components/TabBar';

const ONBOARDING_KEY = 'emotional_processing_onboarded';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
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
  };

  // Don't render anything until we've checked localStorage to avoid flash
  if (!hasChecked) return null;

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home onReplayOnboarding={() => setShowOnboarding(true)} />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/process" element={<ProcessQueue />} />
        <Route path="/process/:entryId" element={<ProcessChat />} />
        <Route path="/log-good-moment" element={<LogGoodMoment />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/patterns" element={<Patterns />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default App;
