import { createContext, useEffect, useRef, useState } from "react";
import { getMe, login, logout, register } from "./services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const authRequestId = useRef(0)

    const checkSession = async () => {
        const requestId = ++authRequestId.current
        setLoading(true)

        try {
            const data = await getMe()
            if (requestId === authRequestId.current) {
                setUser(data?.user ?? null)
            }
        } catch {
            if (requestId === authRequestId.current) {
                setUser(null)
            }
        } finally {
            if (requestId === authRequestId.current) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        checkSession()
    }, [])

    const handleLogin = async ({ email, password }) => {
        const requestId = ++authRequestId.current
        setLoading(true)

        try {
            const data = await login({ email, password })
            if (!data?.user) {
                throw new Error("Login succeeded without a user payload")
            }

            if (requestId === authRequestId.current) {
                setUser(data.user)
            }

            return data.user
        } catch (error) {
            if (requestId === authRequestId.current) {
                setUser(null)
            }
            throw error
        } finally {
            if (requestId === authRequestId.current) {
                setLoading(false)
            }
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        const requestId = ++authRequestId.current
        setLoading(true)

        try {
            const data = await register({ username, email, password })
            if (!data?.user) {
                throw new Error("Registration succeeded without a user payload")
            }

            if (requestId === authRequestId.current) {
                setUser(data.user)
            }

            return data.user
        } catch (error) {
            if (requestId === authRequestId.current) {
                setUser(null)
            }
            throw error
        } finally {
            if (requestId === authRequestId.current) {
                setLoading(false)
            }
        }
    }

    const handleLogout = async () => {
        const requestId = ++authRequestId.current
        setLoading(true)

        try {
            await logout()
            if (requestId === authRequestId.current) {
                setUser(null)
            }
        } finally {
            if (requestId === authRequestId.current) {
                setLoading(false)
            }
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, handleLogin, handleRegister, handleLogout }}>
            {children}
        </AuthContext.Provider>
    )
}
