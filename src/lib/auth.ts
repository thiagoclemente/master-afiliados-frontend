export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userStr = localStorage.getItem("user");
  
  if (!userStr) {
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    return user.jwt;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
}
