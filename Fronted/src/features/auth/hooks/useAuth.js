import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context; 

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
            return data;
        } catch (err) {
            console.error("Login error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
            return data;
        } catch (err) {
            console.error("Register error:", err);
            throw err;
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
            console.error("Logout error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const getAndSetUser = async () => {
            try {
                const data = await getMe();
                if (isMounted) {
                    setUser(data.user);
                }
            } catch {
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        getAndSetUser();

        return () => {
            isMounted = false;
        };
    }, [setUser, setLoading]);

    return { user, setUser, loading, handleRegister, handleLogin, handleLogout };
};