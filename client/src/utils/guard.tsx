import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthGuard = ({ children, tokenKey }) => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem(tokenKey);

    useEffect(() => {
        if (!isLoggedIn) {
            const loginPath = tokenKey === 'ohtopup-admin-token' ? '/admin' : '/login';
            navigate(loginPath, { replace: true });
        }
    }, [isLoggedIn, navigate, tokenKey]);

    return children;
};

export default AuthGuard;