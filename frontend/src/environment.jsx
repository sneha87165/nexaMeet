const server = import.meta.env.VITE_BACKEND_URL || 
    (typeof window !== "undefined" && window.location.origin.includes(":5173") 
        ? "http://localhost:8000" 
        : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000"));

export default server;