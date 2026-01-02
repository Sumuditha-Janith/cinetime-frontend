import api from "./api";

type RegisterDataType = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
};

export const register = async (data: RegisterDataType) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const verifyOTP = async (email: string, otp: string) => {
  const res = await api.post("/auth/verify-otp", { email, otp });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const getMyDetails = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const refreshTokens = async (refreshToken: string) => {
  const res = await api.post("/auth/refresh", { token: refreshToken });
  return res.data;
};