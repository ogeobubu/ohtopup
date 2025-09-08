import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('OAuth authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token) {
      // Store the token in localStorage
      localStorage.setItem('ohtopup-token', token);
      toast.success('Successfully signed in with Google!');
      navigate('/dashboard');
    } else {
      toast.error('No authentication token received.');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;