import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const confirm = async () => {
      if (!sessionId) return;
      try {
        setConfirming(true);
        await supabase.functions.invoke('confirm-payment', {
          body: { session_id: sessionId },
        });
      } catch (e) {
        console.error('Confirm payment failed', e);
      } finally {
        if (!cancelled) setConfirming(false);
      }
    };
    confirm();

    const timer = setTimeout(() => navigate('/student'), 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate, sessionId]);

  return (
    <main className="container mx-auto max-w-2xl py-12 px-4">
      <div className="text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Payment Successful</h1>
        <p className="text-muted-foreground">
          {confirming ? 'Finalizing your payment...' : 'Thank you! Your payment was processed successfully. The payment status will be updated shortly.'}
        </p>
        {sessionId && (
          <p className="text-sm text-muted-foreground">
            Session ID: <span className="font-mono text-xs">{sessionId}</span>
          </p>
        )}
        <div className="pt-4">
          <Button asChild>
            <Link to="/student">Go back to dashboard</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Redirecting automatically in 4 seconds...
        </p>
      </div>
    </main>
  );
};

export default PaymentSuccess;
