import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
    timeout: 12000 // 12 seconds timeout to prevent endless hanging
});


// Automatically inject JWT token into all outgoing requests
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const response = await client.post("/register", {
                name,
                username,
                password
            });

            if (response.status === httpStatus.CREATED) {
                return response.data.message;
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Registration failed";
            throw new Error(errorMsg);
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const response = await client.post("/login", {
                username,
                password
            });

            if (response.status === httpStatus.OK) {
                localStorage.setItem("token", response.data.token);
                if (response.data.user) {
                    localStorage.setItem("user", JSON.stringify(response.data.user));
                    setUserData(response.data.user);
                }
                router("/home");
                return response.data;
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Login failed";
            throw new Error(errorMsg);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUserData(null);
        router("/auth");
    };

    const getHistoryOfUser = async () => {
        try {
            const response = await client.get("/get_all_activity");
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to fetch history";
            throw new Error(errorMsg);
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const response = await client.post("/add_to_activity", {
                meeting_code: meetingCode
            });
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to add to history";
            throw new Error(errorMsg);
        }
    };

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
        logout
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};