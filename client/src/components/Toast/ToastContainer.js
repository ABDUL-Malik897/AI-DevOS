import "./Toast.css";

const icons = {
    success: "✓",
    error: "×",
    warning: "!",
    info: "i"
};

const ToastContainer = ({toasts,removeToast}) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast--${toast.type}`}
                    role="status"
                >
                    <div className="toast-icon">
                        {icons[toast.type]}
                    </div>
                    <div className="toast-message">
                        {toast.message}
                    </div>
                    <button
                        type="button"
                        className="toast-close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;