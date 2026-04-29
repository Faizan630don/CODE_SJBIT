import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Upload from './pages/Upload';
import Viewer from './pages/Viewer';
import Dashboard from './pages/Dashboard';
import PatientView from './pages/PatientView';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/viewer" element={<Viewer />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patient" element={<PatientView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
