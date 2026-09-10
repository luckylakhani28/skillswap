import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Repeat2, ShieldCheck } from 'lucide-react';
import SwapBadge from '../components/SwapBadge';
import { useAuth } from '../context/AuthContext';

const examples = [
  { teach: 'DSA', learn: 'Video Editing' },
  { teach: 'Guitar', learn: 'Spanish' },
  { teach: 'Figma', learn: 'React' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero — the exchange itself is the thesis */}
      <section className="py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="chip mb-4 bg-learn-soft text-learn-ink dark:bg-learn/20 dark:text-teal-200">
            No money. No subscriptions. Just skills.
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            Teach what you know.
            <br />
            <span className="text-teach">Learn</span> what you{' '}
            <span className="text-learn">want.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            SkillSwap pairs students who can trade what they're good at for what they
            want to pick up. You bring a skill to the table — someone brings the one
            you're after.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/browse" className="btn-primary">
              Browse skills <ArrowRight className="h-4 w-4" />
            </Link>
            {!user && (
              <Link to="/register" className="btn-ghost">
                Create your profile
              </Link>
            )}
          </div>

          <div className="mt-10 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Real trades happening now
            </p>
            {examples.map((e) => (
              <SwapBadge key={e.teach} teach={e.teach} learn={e.learn} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Feature
          icon={Search}
          title="Find a match"
          body="Search by skill, category, or availability. Filter down to exactly what you want to learn."
        />
        <Feature
          icon={Repeat2}
          title="Send a swap"
          body="Offer one of your skills in exchange. They accept, and you're both set to teach and learn."
        />
        <Feature
          icon={ShieldCheck}
          title="Learn & review"
          body="Mark the swap complete and leave a rating. Reputation is built on real exchanges."
        />
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="card p-6">
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-teach/10 text-teach dark:text-violet-300">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{body}</p>
    </div>
  );
}
