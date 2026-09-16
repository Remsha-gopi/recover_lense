const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (isLocalhost && window.location.port !== "8001"
    ? "http://localhost:8001/api"
    : "/api");

function getHeaders() {
  const token = localStorage.getItem("recoverlens_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = "API Error";
    try {
      const data = await response.json();
      errorDetail = data.detail || JSON.stringify(data);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  demoLogin: (role, demo_patient_code) =>
    request("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ role, demo_patient_code }),
    }),

  getMe: () => request("/auth/me"),

  // Patient
  getPatientHome: (patientId) => request(`/patients/${patientId}/home`),

  getCheckinNextQuestion: (patientId, answeredKeys = [], lang = "en") =>
    request(
      `/patients/${patientId}/checkin/next-question?answered=${answeredKeys.join(",")}&lang=${lang}`
    ),

  submitCheckin: (patientId, measurements, freeNote, languageUsed) =>
    request(`/patients/${patientId}/checkin/submit`, {
      method: "POST",
      body: JSON.stringify({
        measurements,
        free_note: freeNote,
        language_used: languageUsed,
      }),
    }),

  getPatientTrajectory: (patientId) => request(`/patients/${patientId}/trajectory`),

  getPatientPrediction: (patientId) => request(`/patients/${patientId}/prediction`),

  getPatientPredictionHistory: (patientId) =>
    request(`/patients/${patientId}/prediction/history`),

  getPatientExplanation: (patientId) => request(`/patients/${patientId}/explanation`),

  getPatientAlerts: (patientId) => request(`/patients/${patientId}/alerts`),

  getPatientHistory: (patientId) => request(`/patients/${patientId}/history`),

  getPatientUpdates: (patientId) => request(`/patients/${patientId}/updates`),

  updatePatientLanguage: (patientId, lang) =>
    request(`/patients/${patientId}/language?lang=${lang}`, {
      method: "PUT",
    }),

  // Care Team
  getCareTeamQueue: (filter = "all") => request(`/careteam/queue?filter=${filter}`),

  getCareTeamPatientDetail: (patientId) => request(`/careteam/patients/${patientId}`),

  reviewAlert: (patientId, alertId, action = "reviewed", sendUpdateMessage = "") =>
    request(`/careteam/patients/${patientId}/alerts/${alertId}/review`, {
      method: "POST",
      body: JSON.stringify({
        action,
        send_update_message: sendUpdateMessage,
      }),
    }),

  sendCareTeamUpdate: (patientId, message) =>
    request(`/careteam/patients/${patientId}/updates`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  addProfessionalNote: (patientId, noteText, isPatientVisible = true) =>
    request(`/careteam/patients/${patientId}/notes`, {
      method: "POST",
      body: JSON.stringify({
        note_text: noteText,
        is_patient_visible: isPatientVisible,
      }),
    }),

  addRecoveryGoal: (patientId, title, targetDay = null) =>
    request(`/careteam/patients/${patientId}/goals`, {
      method: "POST",
      body: JSON.stringify({ title, target_day: targetDay }),
    }),

  completeMonitoring: (patientId, completionMessage) =>
    request(`/careteam/patients/${patientId}/complete-monitoring`, {
      method: "POST",
      body: JSON.stringify({ completion_message: completionMessage }),
    }),

  // AI Recovery Coach
  askRecoveryCoach: (patientId, question, language = "en") =>
    request("/ai/ask", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        question,
        language,
      }),
    }),

  // Demo
  resetDemo: () => request("/demo/reset", { method: "POST" }),
};
