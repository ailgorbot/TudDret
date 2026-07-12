export default function Loading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-label="Chargement de l'itinéraire"
    >
      <div className="h-[420px] animate-pulse rounded-3xl bg-ocean-100" />
      <div className="h-10 w-2/3 animate-pulse rounded-full bg-sand-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-sand-100" />
        ))}
      </div>
    </main>
  );
}
