import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import { useCreateProject } from "@/hooks/use-projects";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CreateProject() {
  const { mutate: createProject, isPending } = useCreateProject();
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriteria, setNewCriteria] = useState("");

  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      expectedResult: "",
      deadline: "",
      budget: "",
      criteria: [],
    },
  });

  const handleAddCriteria = () => {
    if (newCriteria.trim()) {
      const updated = [...criteria, newCriteria.trim()];
      setCriteria(updated);
      form.setValue("criteria", updated);
      setNewCriteria("");
    }
  };

  const handleRemoveCriteria = (index: number) => {
    const updated = criteria.filter((_, i) => i !== index);
    setCriteria(updated);
    form.setValue("criteria", updated);
  };

  const onSubmit = (data: any) => {
    createProject(data);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="-ml-4 mb-4 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Create New Brief</h1>
            <p className="text-muted-foreground">Define your project requirements to find the perfect freelancer.</p>
          </div>

          <Card className="shadow-lg shadow-primary/5 border-border/60">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Corporate Website Redesign" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Project Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the project goals, audience, and scope..." 
                            className="min-h-[150px] resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Deadline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 2 weeks, or Dec 31st" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Budget (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. $2,000 - $5,000" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="expectedResult"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Expected Deliverables</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List specific files, formats, or outcomes..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="text-base font-semibold">Selection Criteria</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        value={newCriteria} 
                        onChange={(e) => setNewCriteria(e.target.value)}
                        placeholder="Add a criterion (e.g. React experience)"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCriteria())}
                      />
                      <Button type="button" onClick={handleAddCriteria} variant="secondary">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {criteria.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {criteria.map((item, index) => (
                          <div key={index} className="bg-muted px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
                            <span>{item}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveCriteria(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="px-8 shadow-lg shadow-primary/20"
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Brief
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
