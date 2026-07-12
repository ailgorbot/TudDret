"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="rounded-full bg-coral-100 px-4 py-1.5 text-sm font-semibold text-coral-700">
        Oups
      </span>
      <h1 className="font-display text-3xl text-ocean-900">Une vague imprévue</h1>
      <p className="text-ocean-900/70">
        Quelque chose s&apos;est mal passé. Vos données restent en sécurité dans la
        base — réessayez dans un instant.
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-12 rounded-full bg-ocean-700 px-6 font-semibold text-white transition hover:bg-ocean-800"
      >
        Réessayer
      </button>
    </main>
  );
}
