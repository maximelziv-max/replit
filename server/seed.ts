
import { storage } from "./storage";
import { db } from "./db";

async function seed() {
  console.log("Seeding database...");
  
  // Check if users exist
  const existingUser = await storage.getUserByUsername("customer1");
  if (!existingUser) {
    const user = await storage.createUser({ username: "customer1" });
    const freelancer = await storage.createUser({ username: "freelancer1" });
    
    const project = await storage.createProject(user.id, {
      title: "MVP Marketplace Platform",
      description: "Need a simple platform for projects and offers. No auth password required, just username.",
      expectedResult: "A working MVP with React and Node.js.",
      deadline: "3 days",
      budget: "$1000",
      criteria: ["Speed", "Quality"]
    });
    
    await storage.createOffer({
      projectId: project.id,
      freelancerName: "Alice Dev",
      contact: "alice@example.com",
      approach: "I will use the T3 stack for rapid development.",
      deadline: "2 days",
      price: "$900",
      guarantees: "Bug free code",
      risks: "Scope creep"
    });
    
    console.log("Seeding complete!");
  } else {
    console.log("Database already seeded.");
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
