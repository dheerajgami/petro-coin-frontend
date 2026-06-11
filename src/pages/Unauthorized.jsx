import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50">
      <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold text-slate-800 mb-4">Access Denied</h1>
      <p className="text-slate-500 mb-8 text-center max-w-md">
        You do not have the required role permissions to view this panel. Please log in with the appropriate account.
      </p>
      <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium">
        Go to My Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
