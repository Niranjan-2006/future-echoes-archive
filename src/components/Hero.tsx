
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();
  
  const handleCreateCapsule = () => {
    navigate("/create");
  };
  
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-accent to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Preserve Your Moments in Time
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Create digital virtual capsules filled with your memories, thoughts, and emotions.
          Set a future date and rediscover them when the time comes.
        </p>
        <Button
          size="lg"
          className="mt-8 hover-scale group"
          onClick={handleCreateCapsule}
        >
          Create Your Virtual Capsule
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
        </Button>
      </motion.div>
    </section>
  );
};
