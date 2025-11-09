import { Link, useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id');

  return (
    <main className="container mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
      <p className="text-muted-foreground mb-6">Thank you! Your payment was processed by Stripe.</p>
      {sessionId && (
        <p className="text-sm mb-4">Session ID: <span className="font-mono">{sessionId}</span></p>
      )}
      <Link to="/student" className="underline">Go back to your dashboard</Link>
    </main>
  );
};

export default PaymentSuccess;
