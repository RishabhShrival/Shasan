import { ArrowDown, ChevronRight, Crown, Landmark, Scale, Users } from "lucide-react";

import { LandingActions } from "@/components/landing/landing-actions";
import { Button } from "@/components/ui/button";

const principles = [
  { icon: Scale, label: "Answer the question", detail: "Each turn, answer a Yes/No political question. Your answer earns 4 resources of different ideologies." },
  { icon: Users, label: "Buy voters & sealed cards", detail: "Spend resources on as many voter cards and sealed powers as you can afford, then place voters on the map." },
  { icon: Landmark, label: "Win every majority", detail: "A majority means MORE than half of a constituency's seats. The election ends when every constituency has one." },
];

const ideologies = [
  { label: "Capitalism", color: "#2f9e57", detail: "Markets, business & growth" },
  { label: "Idealism", color: "#e3b928", detail: "Ethics, welfare & transparency" },
  { label: "Conservatism", color: "#e0761f", detail: "Religion, community & tradition" },
  { label: "Supremacy", color: "#8c1d2f", detail: "Strong state, order & national pride" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b13] text-white selection:bg-[#d9ae4d] selection:text-[#0b101b]">
      <div aria-hidden="true" className="paper-texture absolute inset-0" />
      <div aria-hidden="true" className="absolute left-1/2 top-[-28rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#c58e30]/[0.11] blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-0 left-[-15rem] h-[32rem] w-[32rem] rounded-full bg-[#7c1d2a]/[0.14] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <a href="#top" className="inline-flex items-center gap-2.5" aria-label="THRONE home">
            <span className="flex size-8 items-center justify-center border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 text-[#e6c16d]">
              <Crown size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-bold tracking-[0.2em] text-[#f9edcf]">THRONE</span>
          </a>
          <a className="text-xs font-semibold tracking-[0.13em] text-[#aab5c3] transition hover:text-[#e7c978]" href="#how-to-play">
            HOW TO PLAY
          </a>
        </header>

        <section id="top" className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-20 lg:py-24">
          <p className="animate-fade-up text-xs font-bold tracking-[0.24em] text-[#d9ae4d]">A MULTIPLAYER STRATEGY BOARD GAME</p>
          <h1 className="animate-fade-up mt-5 max-w-5xl font-serif text-6xl font-black leading-[0.84] tracking-[-0.055em] text-[#f9eed7] [animation-delay:80ms] sm:text-8xl lg:text-9xl">
            THE MANDATE
            <span className="block bg-gradient-to-b from-[#f1ce7b] to-[#ad772d] bg-clip-text text-transparent">IS YOURS.</span>
          </h1>
          <p className="animate-fade-up mt-7 max-w-xl text-base leading-7 text-[#aeb9c7] [animation-delay:160ms] sm:text-lg">
            Navigate conviction, compromise, and consequence. Build your coalition, secure each constituency, and claim the throne.
          </p>
          <div className="animate-fade-up mt-10 w-full [animation-delay:240ms]">
            <LandingActions />
          </div>
          <a className="mt-10 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#8d9aaa] transition hover:text-[#e5c36e]" href="#how-to-play">
            LEARN THE RULES <ArrowDown size={15} aria-hidden="true" />
          </a>
        </section>

        <section id="how-to-play" className="border-t border-white/[0.08] pt-9 sm:pt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">THE ROAD TO POWER</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#f4ead6]">A game of hard choices.</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-fit px-0 text-[#d9ae4d] hover:bg-transparent hover:text-[#f2d37f]">
              <a href="#top">ENTER THE CAMPAIGN <ChevronRight size={15} aria-hidden="true" /></a>
            </Button>
          </div>
          <div className="mt-7 grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
            {principles.map(({ icon: Icon, label, detail }, index) => (
              <article key={label} className="bg-[#0b111d]/90 p-6 sm:p-7">
                <span className="text-xs font-bold tracking-[0.18em] text-[#c89242]">0{index + 1}</span>
                <Icon className="mt-7 text-[#e2bb61]" size={25} strokeWidth={1.25} aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9da9b9]">{detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ideologies.map((ideology) => (
              <div key={ideology.label} className="flex items-center gap-3 border border-white/[0.08] bg-[#0b111d]/70 px-4 py-3">
                <span className="size-3 rounded-full" style={{ backgroundColor: ideology.color }} />
                <span>
                  <span className="block text-sm font-semibold text-white">{ideology.label}</span>
                  <span className="block text-xs text-[#8d9aab]">{ideology.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-[#8d9aab]">
            Gerrymandering: once per turn, move one voter from a constituency where you have the most voters to an adjacent one. Sealed cards cost any 4 resources and stay secret until you play them.
          </p>
        </section>
      </div>
    </main>
  );
}
