export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// Backend origin for file/image URLs (strips trailing /api from BASE_URL)
export const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');

/**
 * Helper to get the correct URL for a file/image.
 * If the path starts with http, it is returned as is (e.g. Cloudinary URLs).
 * Otherwise, it prepends the BACKEND_URL.
 */
export const getFileUrl = (path: any) => {
    if (!path || typeof path !== 'string') return '';
    
    const trimmedPath = path.trim();
    
    // If it's already an absolute URL (http://, https://, or //) return it as is
    if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith('//')) {
        return trimmedPath;
    }
    
    // Prevent double slashes or missing slashes
    const base = BACKEND_URL.replace(/\/+$/, '');
    const relative = trimmedPath.replace(/^\/+/, '');
    
    return `${base}/${relative}`;
};

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: any = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response, url?: string) => {
    // Only redirect to /login on 401 for AUTHENTICATED routes.
    // If the 401 comes from the login endpoint itself, just let the error
    // propagate to the catch block so the form can show the error message
    // without causing a hard page reload (window.location.href).
    const isLoginEndpoint = url?.includes('/auth/login') || url?.includes('/auth/');
    if (response.status === 401 && !isLoginEndpoint) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'API Error');
        (error as any).response = { data };
        (error as any).status = response.status;
        throw error;
    }

    return { data };
};


const api = {
    get: async (url: string, config?: any) => {
        let fullUrl = `${BASE_URL}${url}`;
        if (config?.params) {
            const params = new URLSearchParams(config.params).toString();
            fullUrl += `?${params}`;
        }
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response, fullUrl);
    },
    post: async (url: string, data?: any, config?: any) => {
        const fullUrl = `${BASE_URL}${url}`;
        const headers = getHeaders();

        let body;
        if (data instanceof FormData) {
            delete headers['Content-Type'];
            body = data;
        } else {
            body = JSON.stringify(data);
        }

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: config?.headers ? { ...headers, ...config.headers } : headers,
            body,
        });

        return handleResponse(response, fullUrl);
    },
    put: async (url: string, data?: any, config?: any) => {
        const fullUrl = `${BASE_URL}${url}`;
        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response, fullUrl);
    },
    delete: async (url: string, config?: any) => {
        const fullUrl = `${BASE_URL}${url}`;
        const response = await fetch(fullUrl, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response, fullUrl);
    },
    patch: async (url: string, data?: any, config?: any) => {
        const fullUrl = `${BASE_URL}${url}`;
        const response = await fetch(fullUrl, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response, fullUrl);
    },
};

/**
 * Helper: Returns Authorization headers for raw calls.
 */
export const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;
