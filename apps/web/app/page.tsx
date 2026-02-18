"use client";
import { useEffect, useState } from "react";
import { constants } from "@chaosar/config";
import { Button, Badge, Card, Section, ScrollHint } from "@chaosar/ui";
import { Clock, Smartphone, Users, CheckCircle2, ShieldCheck, Zap, BadgeCheck, } from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppUrl } from "@chaosar/config";
import { IPhoneMenuMock } from "./components/hero/IPhoneMenuMock";

const iconMap: Record<string, any> = {
  clock: Clock,
  smartphone: Smartphone,
  users: Users,
  checkCircle2: CheckCircle2,
  shieldCheck: ShieldCheck,
  zap: Zap,
  badgeCheck: BadgeCheck,
};


export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [demoUrl, setDemoUrl] = useState<string>("");
  
  useEffect(() => {
    setMounted(true);
    
    // Hardcoded production URL for demo menu
    if (typeof window !== "undefined") {
      setDemoUrl("https://menu.chaosarmenu.com/menu/cafe-l-amour/cafe-lamour-besiktas");
    }
  }, []);
  
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

  return (
    <main className="min-h-screen bg-[#ECEFF3]">
      {/* Hero Section */}
      <Section className="pt-4 md:pt-10 lg:pt-12 pb-12 md:pb-12 bg-[#ECEFF3]">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-12 lg:gap-16 items-center min-h-[600px] md:min-h-[700px]">
          {/* Left Column */}
          <div className="space-y-5 md:space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1F2937] leading-[1.1] tracking-tight"
            >
              {constants.marketing.hero.h1}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed"
            >
              {constants.marketing.hero.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2"
            >
              {demoUrl && (
                <Button
                  size="lg"
                  className="!rounded-xl w-full sm:w-auto px-6 py-3 !bg-[#0F172A] hover:!bg-[#1e293b] focus:ring-2 focus:ring-[#00B4D8] focus:ring-offset-2"
                  onClick={() => {
                    if (typeof window !== "undefined" && demoUrl) {
                      console.log("Redirecting to demo app...", demoUrl);
                      window.location.assign(demoUrl);
                    }
                  }}
                >
                  {constants.marketing.hero.ctaPrimary}
                </Button>
              )}
              <span className="text-sm text-gray-500">
                {constants.marketing.hero.ctaPrimary}
              </span>
            </motion.div>

            {/* Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {constants.marketing.hero.chips.map((chip, idx) => {
                const Icon = mounted ? iconMap[chip.icon] : null;
                return (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1.5 text-xs md:text-sm">
                    {Icon ? <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : null}
                    {chip.text}
                  </Badge>
                );
              })}
            </motion.div>

            {/* Micro Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-5 border-t border-[#E5E7EB]"
            >
              <div className="flex items-center gap-2 text-base md:text-lg font-semibold text-[#1F2937]">
                {constants.marketing.hero.microFlow.title}
              </div>
              <p className="text-sm text-gray-600 mt-1.5">
                {constants.marketing.hero.microFlow.description}
              </p>
              {constants.marketing.hero.microFlow.subDescription && (
             <p className="text-sm text-gray-600 mt-1.5">
               {constants.marketing.hero.microFlow.subDescription}
               
             </p>
              )}
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {constants.marketing.hero.categories.map((cat, idx) => (
                <Badge key={idx} variant="default" className="text-xs md:text-sm">
                  {cat}
                </Badge>
              ))}
            </motion.div>

            {/* First in Turkey */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xs text-gray-400 pt-4"
            >
              {constants.marketing.hero.firstInTurkey}
            </motion.p>

            <div className="pt-2">
              {mounted ? <ScrollHint /> : null}
            </div>
          </div>

          {/* Right Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
           className="relative flex items-start justify-center min-h-[500px] md:min-h-[600px] -mt-8"
>
            {/* Scene Card Container */}
            <div className="relative w-full max-w-[520px] md:max-w-[560px] lg:max-w-[580px] aspect-[3/4] md:aspect-[2/3] rounded-3xl overflow-hidden border border-[rgba(15,23,42,0.08)] shadow-2xl">
              {/* Background PNG */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/hero/hero-bg.png')",
                }}
              />
              
              {/* Vignette Overlay - White edges fade to transparent center */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(255,255,255,0.70) 100%)',
                }}
              />
              
              {/* Subtle Navy Tint Overlay */}
              <div className="absolute inset-0 bg-[rgba(7,16,36,0.10)]" />

              {/* Phone Highlight Glow - Radial glow behind phone */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[400px] h-[400px] rounded-full bg-[rgba(0,180,216,0.18)] blur-[80px]" />
              </div>

              {/* Phone Shadow - Large soft ellipse below phone */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="absolute top-1/2 left-1/2 w-[320px] h-[200px] rounded-full bg-[rgba(15,23,42,0.25)] blur-[60px]"
                  style={{
                    transform: 'translate(4%, 8%)',
                  }}
                />
              </div>

              {/* Phone Mockup */}
<div className="relative z-20 flex items-center justify-center">
  {/* MOBILE */}
  <div className="block md:hidden w-full px-6 pb-10 pt-6">
    <div className="mx-auto w-[195px]">
      <IPhoneMenuMock className="w-full" />
    </div>
  </div>

  {/* DESKTOP */}
  <div className="hidden md:block w-full p-32">
    <div className="mx-auto w-[240px] lg:w-[540px] xl:w-[240px]">
      <IPhoneMenuMock className="w-full" />
    </div>
  </div>
</div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Why More Sales */}
      <Section id="why" className="bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-4">
            {constants.marketing.sections.whyMoreSales.h2}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {constants.marketing.sections.whyMoreSales.sub}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {constants.marketing.sections.whyMoreSales.cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card hover>
                <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                <p className="text-gray-600">{card.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-gray-600 italic">
          {constants.marketing.sections.whyMoreSales.bottomText}
        </p>
      </Section>

      {/* How It Works */}
      <Section id="how">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-4">
            {constants.marketing.sections.howItWorks.h2}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {constants.marketing.sections.howItWorks.sub}
          </p>
        </div>
        

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {constants.marketing.sections.howItWorks.steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{idx + 1}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600 mb-2">{step.text}</p>
              <p className={`text-sm ${(step as any).noteBold ? "font-bold text-[#0F172A]" : "text-gray-500"}`}>
                {step.note}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="mt-16 text-center text-2xl text-gray-600">
          {constants.marketing.sections.howItWorks.bottomText}
        </p>
        <p className="mt-2 text-m text-center opacity-80">
          {constants.marketing.sections.howItWorks.bottomSubText}
</p>


      </Section>

      {/* Packages */}
      <Section id="packages" className="bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-4">
            {constants.marketing.sections.packages.h2}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {constants.marketing.sections.packages.sub}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {constants.marketing.sections.packages.plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className={`relative ${plan.popular ? "ring-2 ring-[#0F172A]" : ""}`}>
                {plan.popular && (
                  <Badge variant="highlight" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    EN POPÜLER
                  </Badge>
                )}
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      {mounted ? <CheckCircle2 className="w-5 h-5 text-[#0F172A]" /> : null}
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                   {plan.description}
                   
                </p>
              </Card>
            </motion.div>
          ))}
              <div className="col-span-full w-full flex justify-center mb-12">
                <a
                    href={buildWhatsAppUrl(whatsappNumber, "Merhaba, paketler hakkında bilgi almak istiyorum.")}
                    target="_blank"
                  rel="noopener noreferrer"
  >
                <Button size="lg" className="!rounded-xl px-24 mt-12">
              İletişime Geç
             </Button>
            </a>
       </div>       
        </div>

        <div className="text-center mb-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            {constants.marketing.sections.packages.pricingNotes.map((note, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {mounted ? <CheckCircle2 className="w-4 h-4" /> : null}
                {note}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-6">
            {constants.marketing.sections.packages.howToStart.title}
          </h3>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {constants.marketing.sections.packages.howToStart.steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{idx + 1}</span>
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>

          {whatsappNumber && (
            <div className="text-center">
              <a
                href={buildWhatsAppUrl(whatsappNumber, constants.marketing.whatsapp.message)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="w-full md:w-auto">
                  {constants.marketing.sections.packages.cta.primary}
                </Button>
              </a>
              <p className="text-sm text-gray-500 mt-2">
                {constants.marketing.sections.packages.cta.subtext}
              </p>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}

