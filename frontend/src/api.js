const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(endpoint, options = {}) {
  const accessToken = localStorage.getItem("access");

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  let response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status !== 401) {
    return response;
  }

  const refreshToken = localStorage.getItem("refresh");

  if (!refreshToken) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.reload();

    return response;
  }

  const refreshResponse = await fetch(
    `${API_BASE_URL}/api/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  if (!refreshResponse.ok) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.reload();

    return response;
  }

  const refreshData = await refreshResponse.json();

  localStorage.setItem("access", refreshData.access);

  const newHeaders = {
    ...(options.headers || {}),
    Authorization: `Bearer ${refreshData.access}`,
  };

  return fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: newHeaders,
    }
  );
}
