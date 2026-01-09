import { usePublicProject } from "@/hooks/use-projects";
import { useCreateOffer } from "@/hooks/use-offers";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, DollarSign, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function PublicProject() {
  const [, params] = useRoute("/p/:token");
  const token = params?.token || "";
  const { data: project, isLoading: isLoadingProject } = usePublicProject(token);
  const { mutate: createOffer, isPending: isSubmitting, isSuccess } = useCreateOffer(token);
  const [activeSection, setActiveSection] = useState<'brief' | 'offer'>('brief');

  const form = useForm({
    resolver: zodResolver(insertOfferSchema),
    defaultValues: {
      freelancerName: "",
      contact: "",
      approach: "",
      deadline: "",
      price: "",
      guarantees: "",
      risks: "",
    },
  });

  if (isLoadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <p className="text-muted-foreground">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Offer Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Your proposal has been sent to the client securely. They will contact you directly if they are interested.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Submit Another Offer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-display font-bold text-xl tracking-tight text-primary">Briefly</div>
          <Button 
            onClick={() => {
              setActiveSection('offer');
              document.getElementById('offer-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="shadow-lg shadow-primary/20"
          >
            Submit Proposal
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-8 animate-in">
          <div>
            <Badge variant="outline" className="mb-4">Project Brief</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6 text-foreground">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-muted-foreground text-sm font-medium">
              <span className="flex items-center bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                Deadline: {project.deadline}
              </span>
              {project.budget && (
                <span className="flex items-center bg-white px-3 py-1.5 rounded-full border shadow-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-primary" />
                  Budget: {project.budget}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-none shadow-md">
                <CardContent className="p-8">
                  <h3 className="text-lg font-bold font-display mb-4">Description</h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground text-lg">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold font-display">Requirements</h3>
                <div className="grid gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Expected Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{project.expectedResult}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               {project.criteria && (
                <Card className="border-none shadow-sm bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-primary">Selection Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(project.criteria as string[]).map((c, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="font-medium">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section id="offer-form" className="pt-12 border-t border-border/60">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold mb-3">Submit Your Offer</h2>
              <p className="text-muted-foreground">Ready to take on this project? Send your proposal below.</p>
            </div>

            <Card className="shadow-xl border-border/60">
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createOffer(data))} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="freelancerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Info</FormLabel>
                            <FormControl>
                              <Input placeholder="Email or Phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="approach"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Approach</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How will you tackle this project?" 
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Price</FormLabel>
                            <FormControl>
                              <Input placeholder="$1,500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Time</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 10 days" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="guarantees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guarantees (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g. 3 rounds of revisions included" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="risks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potential Risks (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any dependencies or risks?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full text-base font-semibold shadow-lg shadow-primary/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Submit Proposal
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
