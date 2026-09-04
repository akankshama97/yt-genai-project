import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import axios from "axios";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
    // 1. Fixed typo: setLoding -> setLoading
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context; 

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe();
                setUser(data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false); // Ye ab bina kisi error ke loading ko stop kar dega!
            }
        };

        getAndSetUser();
    }, []);

    return { user, setUser, loading, handleRegister, handleLogin, handleLogout };
};