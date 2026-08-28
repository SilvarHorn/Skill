"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import RoleSelector from '@/components/auth/RoleSelector';
import RoleCollisionModal from '@/components/RoleCollisionModal';
import {
  Sparkles,
  AlertTriangle,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collisionData, setCollisionData] = useState(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['STUDENT', 'INDUSTRY', 'ORGANIZATION', 'INSTITUTE', 'ADMIN'].includes(roleParam.toUpperCase())) {
      setActiveRole(roleParam.toUpperCase() === 'ORGANIZATION' ? 'INDUSTRY' : roleParam.toUpperCase());
    }

    const collision = searchParams.get('collision');
    const existingRole = searchParams.get('existingRole');
    const attemptedRole = searchParams.get('attemptedRole');

    if (collision === 'true' && existingRole) {
      setCollisionData({
        existingRole: existingRole.toUpperCase(),
        attemptedRole: (attemptedRole || 'INDUSTRY').toUpperCase(),
      });
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pre-OAuth intent call (if new sign in intent is generated for this role)
      try {
        if (activeRole !== 'ADMIN') {
          await fetch('/api/auth/signup-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: activeRole === 'INDUSTRY' ? 'INDUSTRY' : activeRole,
            }),
          });
        }
      } catch {
        // Continue to sign in even if pre-intent fails (existing accounts will resolve via Better Auth)
      }

      // Trigger OAuth redirect through /profile/complete dispatcher
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/profile/complete',
      });
    } catch (err) {
      setError(err.message || 'Failed to initialize Google authentication');
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'STUDENT':
        return 'Student';
      case 'INDUSTRY':
        return 'Industry';
      case 'INSTITUTE':
        return 'Institute';
      case 'ADMIN':
        return 'Admin Governance';
      default:
        return role;
    }
  };

  return (
    <div className="max-w-xl w-full space-y-7 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-500/5">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          Sign In to Skill Bridge
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Role-Based Authentication & Verification Governance Portal
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection Tabs / Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Your Role
          </label>
          <button
            type="button"
            onClick={() => setActiveRole(activeRole === 'ADMIN' ? 'STUDENT' : 'ADMIN')}
            className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            {activeRole === 'ADMIN' ? 'Standard User Portals' : 'Admin Login'}
          </button>
        </div>

        {activeRole === 'ADMIN' ? (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-3">
            <Shield className="w-5 h-5 flex-shrink-0 text-purple-400" />
            <div>
              <span className="font-bold">Administrative Governance Portal:</span>
              <p className="text-[11px] text-purple-300/80 mt-0.5">
                Signing in with authorized super admin credentials grants system moderation and audit log permissions.
              </p>
            </div>
          </div>
        ) : (
          <RoleSelector
            selectedRole={activeRole}
            onSelectRole={(role) => setActiveRole(role)}
            disabled={loading}
            layout="compact"
          />
        )}
      </div>

      {/* Informative Role Immutability Banner */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-2 font-semibold text-emerald-400">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Single Google Account = Exactly One Role</span>
        </div>
        <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
          Signing into <strong>{getRoleDisplayName(activeRole)}</strong> portal. If you previously registered under a different role, you will be automatically routed to your bound role dashboard.
        </p>
      </div>

      {/* Action Button */}
      <div className="space-y-4 pt-1">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Connecting with Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google as {getRoleDisplayName(activeRole)}</span>
              <ArrowRight className="w-4 h-4 ml-1 text-slate-600" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Create new account
          </Link>
        </p>
      </div>

      {/* Role Collision Modal */}
      {collisionData && (
        <RoleCollisionModal
          isOpen={true}
          existingRole={collisionData.existingRole}
          attemptedRole={collisionData.attemptedRole}
          onClose={() => setCollisionData(null)}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[88vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
