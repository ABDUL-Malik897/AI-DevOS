import {createContext,useCallback,useContext,useMemo,useState} from "react";
import ToastContainer from "./ToastContainer";

const ToastContext = createContext(null);

const createToast = (message, type = "info", duration = 3500) => ({
    id: Date.now() + Math.random().toString(36).slice(2),
    message,
    type,
    duration
});

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message,type = "info",duration = 3500) => {
        if (!message) {
            return;
        }
        const toast = createToast(message, type, duration);
        setToasts((previous) => [
            ...previous,
            toast
        ]);
        if (duration > 0) {
            setTimeout(() => { removeToast(toast.id)}, duration);
        }
        return toast.id;
    },[removeToast]);

    const toast = useMemo(() => ({
        show: (message, duration) => showToast(message, "info", duration),
        success: (message, duration) => showToast(message, "success",duration),
        error: (message, duration) => showToast(message, "error", duration),
        warning: (message, duration) => showToast(message, "warning", duration),
        info: (message, duration) => showToast(message, "info", duration),
        remove: removeToast,
        clear: () => {
            setToasts([]);
        }
    }),[showToast, removeToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer
                toasts={toasts}
                removeToast={removeToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return context;
};