export default function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
      <p className="text-xs uppercase tracking-widest text-terracotta">Coming soon</p>
      <h1 className="mt-3 font-display text-5xl text-forest">{title}</h1>
      <p className="mt-4 text-muted">{note}</p>
    </section>
  )
}