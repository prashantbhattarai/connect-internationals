import Link from "next/link";
import { notFound } from "next/navigation";
const sections = ["Discover", "Requests", "Messages", "Circles", "Invite", "Profile"] as const;
export function generateStaticParams() { return [{ section: [] }, ...sections.slice(1).map(name => ({ section: [name.toLowerCase()] }))]; }
export default function ConnectPage({ params }: { params: { section?: string[] } }) {
  const slug = params.section?.join("/") || "discover";
  const current = sections.find(name => name.toLowerCase() === slug);
  if (!current) notFound();
  return <div className="min-h-screen">
    <div className="bg-teal-950 px-5 py-3 text-center text-sm leading-6 text-teal-50"><strong>Local demo · Foundation only.</strong> No real accounts or messages. Future demo profiles, academic data, interests and consent will be simulated.</div>
    <header className="mx-auto max-w-6xl px-5 pb-5 pt-8 sm:px-8"><Link href="/connect" className="text-xl font-bold tracking-tight">Connect <span className="text-teal-700">Internationals</span></Link><p className="mt-2 text-sm text-slate-600">A place for friendship, shared ambitions, and a fresh start.</p></header>
    <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap gap-2 border-b border-stone-200 px-5 pb-4 sm:px-8">{sections.map(name => <Link key={name} href={name === "Discover" ? "/connect" : `/connect/${name.toLowerCase()}`} aria-current={name === current ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold ${name === current ? "bg-teal-800 text-white" : "text-slate-600 hover:bg-stone-200"}`}>{name}</Link>)}</nav>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16"><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Connect / {current}</p><h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{current === "Discover" ? "Find your people. Build your next chapter." : current}</h1>
    <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{current === "Discover" ? "Meet people through shared interests, new experiences, and goals that matter to you." : `The ${current.toLowerCase()} experience is planned for a later stage.`}</p>
    <section aria-labelledby="status" className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-center gap-3"><h2 id="status" className="text-lg font-bold">Foundation is ready</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Feature not yet available</span></div><p className="mt-3 max-w-2xl leading-7 text-slate-600">This stage establishes the app and local database environment. Profiles, persona switching, discovery, introductions, chat, circles and invitation actions are not implemented yet. No student directory is exposed.</p></section>
    <div className="mt-8 grid gap-5 sm:grid-cols-3">{[ ["Friendship first", "Make room for shared hobbies and everyday connections."], ["You choose visibility", "Discovery will require opt-in and deliberate sharing."], ["A thoughtful introduction", "The planned flow opens chat only after acceptance."] ].map(([title, text]) => <article key={title} className="p-2"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
    </main><footer className="mx-auto max-w-6xl px-5 py-8 text-xs text-slate-500 sm:px-8">Independent local prototype · Connecting will be free for everyone.</footer>
  </div>;
}
