export const isTokenExpired = (token: string): boolean => {
  try {
    // Decode JWT token payload
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);

    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If we can't decode it, assume it's expired
  }
};

export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
