import api from "./api";

export const requestPasswordReset = async (email: string) => {
    const res = await api.post("/password/request", { email });
    return res.data;
};

export const verifyResetToken = async (token: string) => {
    const res = await api.get(`/password/verify/${token}`);
    return res.data;
};

export const resetPassword = async (token: string, password: string) => {
    const res = await api.post(`/password/reset/${token}`, { password });
    return res.data;
};