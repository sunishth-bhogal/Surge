import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[22px] font-bold tracking-[-0.025em]">Nothing listed here</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
        That ticker or profile isn&apos;t on Splash yet.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110"
      >
        Back to the feed
      </Link>
    </main>
  );
}
