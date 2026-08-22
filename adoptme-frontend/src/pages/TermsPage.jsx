import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
          <FileText className="h-3.5 w-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: August 2026
        </p>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 sm:p-8 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            1. Acceptance of Terms
          </h2>
          <p>
            By creating an account, accessing, or using the <strong>AdoptMe</strong> web platform, you agree to be bound by these Terms of Service. If you do not agree with these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-blue-500" />
            2. Platform Purpose & Adoption Disclaimer
          </h2>
          <p>
            AdoptMe provides a search aggregation and discovery tool connecting prospective pet parents with independent animal shelters and rescue organizations.
          </p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            AdoptMe is not an adoption agency or animal shelter. All adoption decisions, application reviews, background checks, and fee collections are conducted directly and independently by the respective rescue organization hosting the pet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            3. Accuracy of Animal Listings
          </h2>
          <p>
            While AdoptMe strives to keep listings accurate and up-to-date, pet availability, temperament evaluations, health status, and adoption requirements are provided by partner shelters. AdoptMe cannot guarantee the immediate availability or exact temperament of any listed animal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. User Conduct & Reviews
          </h2>
          <p>
            When utilizing interactive platform features such as submitting shelter reviews or feedback, users agree not to post defamatory, harassing, or fraudulent content. AdoptMe reserves the right to moderate or remove content that violates these guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Termination
          </h2>
          <p>
            Users may delete their account at any time via the Account Settings page. AdoptMe reserves the right to suspend or terminate accounts that breach platform guidelines or abuse platform services.
          </p>
        </section>
      </div>
    </div>
  );
}