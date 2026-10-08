import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Juego } from "@/components/juego/Juego";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [vivo, setVivo] = useState(false);
  useEffect(() => {
    setVivo(true);
  }, []);
  if (!vivo) {
    return (
      <main className="grid h-full place-items-center bg-fondo text-papel">
        <div className="px-6 text-center">
          <h1 className="font-display text-6xl leading-none text-papel">Obra Maestra</h1>
        </div>
      </main>
    );
  }
  return <Juego />;
}
