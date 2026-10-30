import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Printer, Share2, ArrowLeft, ShieldCheck, Award, CheckCircle } from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => api.getCertificate(certificateId!),
    enabled: !!certificateId
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Verifying credential signatures...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-md shadow-xl">
          <Award className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Certificate Not Found</h2>
          <p className="mt-2 text-xs text-slate-500">
            The credential ID <code className="font-mono">{certificateId}</code> does not match any accredited records.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
          >
            Go to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* ACTION BAR (Hidden in Print) */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Link Copied!' : 'Copy Verification Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>

        {/* ELEGANT CERTIFICATE SHEET */}
        <div className="certificate-sheet bg-white text-slate-900 rounded-3xl border-8 border-double border-slate-300 p-8 sm:p-14 shadow-2xl relative overflow-hidden text-center space-y-6">
          
          {/* Subtle Guilloche / Watermark Pattern */}
          <div className="absolute inset-0 border-2 border-dashed border-amber-600/20 m-3 pointer-events-none rounded-2xl" />

          {/* Certificate Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold text-sm tracking-widest uppercase">
              <Award className="w-4 h-4" />
              <span>LearnHub Institute of Technology</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Certificate of Excellence
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              This credential certifies that
            </p>
          </div>

          {/* Student Name */}
          <div className="py-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-indigo-950 border-b-2 border-indigo-900/30 inline-block px-8 pb-2">
              {data.studentName}
            </h2>
          </div>

          {/* Statement */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            has successfully mastered the comprehensive curriculum, completed all hands-on architectural code challenges, and passed the final accreditation examination for
          </p>

          {/* Course Title */}
          <div className="py-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {data.courseTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive Curriculum · {data.totalLessons} Lessons · {(data.totalDurationMinutes / 60).toFixed(1)} Accredited Hours
            </p>
          </div>

          {/* Crest Emblem & Signatures */}
          <div className="pt-8 grid grid-cols-3 items-center gap-4 border-t border-slate-200">
            
            {/* Instructor Signature */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-end justify-center font-serif italic text-base text-slate-700">
                {data.instructorName}
              </div>
              <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[11px] font-bold text-slate-500 uppercase">
                Faculty Instructor
              </div>
            </div>

            {/* Official Seal Emblem */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/src/assets/images/certificate_crest_emblem_1793389667675.jpg"
                alt="Accredited Seal Emblem"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain shadow-md rounded-full border border-amber-300"
              />
              <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase mt-1">
                Verified Credential
              </span>
            </div>

            {/* Date & Registry */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-end justify-center font-serif text-xs text-slate-700">
                {formattedDate}
              </div>
              <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[11px] font-bold text-slate-500 uppercase">
                Issue Date
              </div>
            </div>

          </div>

          {/* Verification Hash Footer */}
          <div className="pt-6 text-center text-[10px] text-slate-400 font-mono">
            Unique Verification ID: <strong className="text-slate-600">{data.certificateId}</strong> · Cryptographically Signed
          </div>

        </div>

      </div>
    </div>
  );
};
