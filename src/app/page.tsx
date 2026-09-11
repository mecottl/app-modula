import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">
        Configurador de cotización para desarrollos inmobiliarios
      </h1>
      <p className="text-sm text-gray-500">
        Fase 0: fundación del proyecto (modelo de datos, motor de precio,
        autenticación y aislamiento multi-tenant). Los módulos del dashboard
        y el configurador público llegan en la Fase 1.
      </p>
      <Link href="/login" className="text-sm underline">
        Ir al dashboard
      </Link>
    </main>
  );
}
