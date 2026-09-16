import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/common/Navbar";
import DisclaimerFooter from "./components/common/DisclaimerFooter";
import LandingPage from "./pages/LandingPage";
import PatientHome from "./pages/patient/PatientHome";
import AdaptiveCheckIn from "./pages/patient/AdaptiveCheckIn";
import PatientProgress from "./pages/patient/PatientProgress";
import PatientHistory from "./pages/patient/PatientHistory";
import PatientUpdates from "./pages/patient/PatientUpdates";
import PatientProfile from "./pages/patient/PatientProfile";
import CareTeamQueue from "./pages/careteam/CareTeamQueue";

function MainApp() {
  const { isAuthenticated, isPatient, isCareTeam } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {!isAuthenticated ? (
          <LandingPage />
        ) : isCareTeam ? (
          <CareTeamQueue />
        ) : isPatient ? (
          <>
            {activeTab === "home" && <PatientHome setActiveTab={setActiveTab} />}
            {activeTab === "checkin" && (
              <AdaptiveCheckIn setActiveTab={setActiveTab} />
            )}
            {activeTab === "progress" && <PatientProgress />}
            {activeTab === "updates" && <PatientUpdates />}
            {activeTab === "history" && <PatientHistory />}
            {activeTab === "profile" && <PatientProfile />}
          </>
        ) : null}
      </main>

      <DisclaimerFooter />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
