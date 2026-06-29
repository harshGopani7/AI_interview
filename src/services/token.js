const TOKEN_KEY = "interview_ai_token";

export const saveToken = (token) => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token;
};

export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};
