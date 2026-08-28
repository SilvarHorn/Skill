"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { School, AlertTriangle, BookOpen, Users, CheckCircle2, ArrowRight, TrendingUp } from "lucide-react";

export default function InstituteDashboardPage() {
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInstituteData() {
      try {
        const [stdRes, alertRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/alerts")
        ]);
        const stdData = await stdRes.json();
        const alertData = await alertRes.json();
        setStudents(stdData.students || []);
        setAlerts(alertData.alerts || []);
      } catch (err) {
        console.error("Error loading institute data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInstituteData();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading Institute Analytics Console...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <School size={14} /> Faculty & Institute Skill Analytics Console
          </div>
          <h1 className="text-3xl font-bold text-slate-100">National Institute of Technology (Analytics Dept)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated industry skill gap detection & privacy-preserving training program dispatch.
          </p>
        </div>

        <Link
          href="/institute/skill-gaps"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
        >
          <AlertTriangle size={16} /> View Aggregated Skill Gap Alerts
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Enrolled Students</span>
          <div className="text-3xl font-black text-slate-100 font-mono">{students.length}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400">Active Skill Gap Alerts</span>
          <div className="text-3xl font-black text-amber-400 font-mono">{alerts.length}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400">Placement Readiness</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">84%</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400">Privacy Safeguard</span>
          <div className="text-xs font-bold text-purple-300">Aggregated Data Only (Zero PII)</div>
        </div>
      </div>

      {/* Skill Gap Alerts Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="text-amber-400" /> Aggregated Industry Skill Gap Alerts
          </h2>
          <Link href="/institute/skill-gaps" className="text-xs text-purple-400 hover:underline">
            View All Alerts &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Skill Gap Detected
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">
                    {alert.opportunityTitle} ({alert.companyName})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {alert.eligibleStudentsCount} Eligible Students • {alert.partialMatchStudentsCount} Students with Preferred Skill Gaps
                  </p>
                </div>

                <Link
                  href={`/institute/training?skill=${encodeURIComponent(alert.topSkillGap)}`}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <BookOpen size={14} /> Create Training Program
                </Link>
              </div>

              {/* Common Missing Skills Summary */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 space-y-2 text-xs">
                <div className="font-bold text-amber-300">
                  Top Missing Skill: <span className="font-mono">{alert.topSkillGap}</span> ({alert.topSkillGapAffectedCount} students affected)
                </div>
                <p className="text-slate-400 text-[11px]">{alert.recommendedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
