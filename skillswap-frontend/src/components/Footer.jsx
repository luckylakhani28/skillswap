export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <p>
        SkillSwap — trade what you know for what you want to learn.
      </p>
      <p className="mt-1 text-xs">Built with the MERN stack · {new Date().getFullYear()}</p>
    </footer>
  );
}
