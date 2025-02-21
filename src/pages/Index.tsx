
import { Hero } from "@/components/Hero";
import { CapsuleCreator } from "@/components/CapsuleCreator";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <Hero />
      <CapsuleCreator />
    </main>
  );
};

export default Index;
