import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthGuard = ({ children, tokenKey }) => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem(tokenKey);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    return children;
};

export default AuthGuard;