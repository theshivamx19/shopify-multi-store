import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        const shop = searchParams.get('shop');
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setMessage('Authorization was denied or failed.');
            return;
        }

        if (!shop || !code) {
            setStatus('error');
            setMessage('Missing required parameters.');
            return;
        }

        try {
            // The backend will handle the OAuth callback
            // We just need to redirect to show the result
            const response = await fetch(
                `http://localhost:3000/auth/callback?${searchParams.toString()}`
            );

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage(`Store "${shop}" connected successfully!`);
                setTimeout(() => {
                    navigate('/stores');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to connect store');
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            setStatus('error');
            setMessage('An error occurred while connecting the store.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center animate-scale-in">
                {status === 'processing' && (
                    <>
                        <LoadingSpinner size="xl" className="mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Connecting Store...</h2>
                        <p className="text-gray-400">Please wait while we complete the setup</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="p-4 bg-green-500/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-green-400">Success!</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to stores...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-red-400">Error</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <Button onClick={() => navigate('/stores')}>
                            Go to Stores
                        </Button>
                    </>
                )}
            </Card>
        </div>
    );
}
