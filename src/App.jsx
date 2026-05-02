import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Capture from './pages/Capture';
import LogGoodMoment from './pages/LogGoodMoment';
import Bank from './pages/Bank';
import TabBar from './components/TabBar';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/log-good-moment" element={<LogGoodMoment />} />
        <Route path="/bank" element={<Bank />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default App;
