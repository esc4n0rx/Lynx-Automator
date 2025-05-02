import { ParticlesBackground } from "@/components/particles-background"
import { LynxTitle } from "@/components/lynx-title"
import { InputSection } from "@/components/input-section"
import { ApiUsageCard } from "@/components/api-usage-card"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      <ParticlesBackground />

      <div className="absolute top-4 right-4 z-10">
        <ApiUsageCard />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center justify-center gap-8">
        <LynxTitle />
        <InputSection />
      </div>
    </main>
  )
}
