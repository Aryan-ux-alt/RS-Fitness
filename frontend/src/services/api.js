const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");

async function refreshAccessToken() {
  const session = JSON.parse(localStorage.getItem("rs_session") || localStorage.getItem("rs_gym_owner_session") || "null");
  if (!session?.refreshToken) throw new Error("No refresh token available");
  
  const isGymOwner = !!localStorage.getItem("rs_gym_owner_session");
  const endpoint = isGymOwner ? "/gym-owners/refresh" : "/auth/refresh";
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Token refresh failed");
  
  // Update session with new access token
  session.accessToken = data.accessToken;
  const storageKey = isGymOwner ? "rs_gym_owner_session" : "rs_session";
  localStorage.setItem(storageKey, JSON.stringify(session));
  
  return data.accessToken;
}

export async function request(path, options = {}, retryCount = 0) {
  const session = JSON.parse(localStorage.getItem("rs_session") || localStorage.getItem("rs_gym_owner_session") || "null");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  
  // Handle token expiration with refresh
  if (res.status === 401 && retryCount === 0 && session?.refreshToken) {
    try {
      await refreshAccessToken();
      return request(path, options, 1); // Retry with new token
    } catch (err) {
      // Refresh failed, clear session
      localStorage.removeItem("rs_session");
      localStorage.removeItem("rs_gym_owner_session");
      throw new Error("Session expired. Please log in again.");
    }
  }
  
  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.data = data; // Attach full response data to error
    error.status = res.status;
    throw error;
  }
  return data;
}

export const signup = payload => request("/auth/signup", { method:"POST", body:JSON.stringify(payload) });
export const login = payload => request("/auth/login", { method:"POST", body:JSON.stringify(payload) });
export const signupGymOwner = payload => request("/gym-owners/signup", { method:"POST", body:JSON.stringify(payload) });
export const loginGymOwner = payload => request("/gym-owners/login", { method:"POST", body:JSON.stringify(payload) });
export const getGymMembers = () => request("/gym-owners/members");
export const getGymRevenue = () => request("/gym-owners/revenue");
export const sendMemberReminder = payload => request("/gym-owners/send-reminder", { method:"POST", body:JSON.stringify(payload) });
export const getPaymentsByMonth = (year, month) => request(`/gym-owners/payments?year=${year}&month=${month}`);
export const logout = refreshToken => {
  const isGymOwner = !!localStorage.getItem("rs_gym_owner_session");
  const endpoint = isGymOwner ? "/gym-owners/logout" : "/auth/logout";
  return request(endpoint, { method:"POST", body:JSON.stringify({ refreshToken }) });
};
export const hydrateUserData = () => request("/me/summary");
export const saveUserData = payload => request("/me/snapshot", { method:"PUT", body:JSON.stringify(payload) });
export const createWorkout = payload => request("/workouts", { method:"POST", body:JSON.stringify(payload) });
export const addBodyMetric = payload => request("/body/metrics", { method:"POST", body:JSON.stringify(payload) });
export const saveCalorieProfile = payload => request("/nutrition/profile", { method:"POST", body:JSON.stringify(payload) });
export const addFoodEntry = payload => request("/nutrition/food", { method:"POST", body:JSON.stringify(payload) });
export const createMembershipPayment = payload => request("/memberships/payments", { method:"POST", body:JSON.stringify(payload) });
export const getUserInvoices = () => request("/memberships/invoices");
export const getInvoiceDetails = invoiceId => request(`/memberships/invoices/${invoiceId}`);
export const getUserPaymentTransactions = () => request("/memberships/transactions");
export const updateGoal = payload => request("/goal", { method:"PUT", body:JSON.stringify(payload) });
export const checkGym = name => request(`/auth/check-gym?name=${encodeURIComponent(name)}`);
export const getRegisteredGyms = () => request("/auth/gyms");
