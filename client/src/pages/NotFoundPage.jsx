import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="panel max-w-lg text-center">
        <div className="panel-body space-y-4">
          <div className="text-5xl font-semibold">404</div>
          <div className="text-slate-300">The requested page could not be found.</div>
          <Link className="btn-primary" to="/dashboard">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
