import { Link } from 'react-router-dom';

const PaymentCancel = () => {
  return (
    <main className="container mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold mb-2">Payment Canceled</h1>
      <p className="text-muted-foreground mb-6">Your payment was canceled. You can try again anytime.</p>
      <Link to="/student" className="underline">Back to dashboard</Link>
    </main>
  );
};

export default PaymentCancel;
