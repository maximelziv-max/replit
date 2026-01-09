import { useMyProjects } from "@/hooks/use-projects";
import { Sidebar } from "@/components/Sidebar";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Calendar, FileText, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: projects, isLoading } = useMyProjects();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end pb-6 border-b border-border/50">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">My Projects</h1>
              <p className="text-muted-foreground mt-2">Manage your briefs and review offers.</p>
            </div>
          </header>

          {!projects || projects.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="No projects yet"
              description="Create your first project brief to start receiving offers from freelancers."
              actionLabel="Create Project"
              actionHref="/projects/new"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 border-border/60">
                    <CardHeader className="space-y-1">
                      <div className="flex justify-between items-start">
                        <Badge variant={project.status === "open" ? "default" : "secondary"} className="mb-2">
                          {project.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {project.createdAt && format(new Date(project.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl truncate pr-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 pt-4 mt-auto flex justify-between items-center text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Deadline: {project.deadline}
                      </div>
                      <div className="flex items-center font-medium text-primary">
                        {project.offerCount} Offers
                        <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
