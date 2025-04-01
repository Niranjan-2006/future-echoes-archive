
import { CapsuleCreator } from "@/components/CapsuleCreator";
import { Navigation } from "@/components/Navigation";

const CreateCapsule = () => {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create Your Virtual Capsule</h1>
        <CapsuleCreator />
      </div>
    </main>
  );
};

export default CreateCapsule;
