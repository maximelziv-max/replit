import { useProjectDetails } from "@/hooks/use-projects";
import { Sidebar } from "@/components/Sidebar";
import { Link, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Share2, 
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { OffersTable } from "@/components/OffersTable";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const { data: project, isLoading } = useProjectDetails(Number(params?.id));
  const { toast } = useToast();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${project?.publicToken}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Ссылка скопирована",
      description: "Публичная ссылка скопирована в буфер обмена.",
    });
  };

  if (isLoading || !project) {
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
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-10 px-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="-ml-4 mb-4 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Вернуться в панель
              </Button>
            </Link>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight mb-3">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant={project.status === "open" ? "default" : "secondary"}>
                    ОТКРЫТ
                  </Badge>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Срок: {project.deadline}
                  </span>
                  {project.budget && (
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Бюджет: {project.budget}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                 <Button variant="outline" onClick={handleCopyLink} className="shadow-sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать ссылку
                </Button>
                <Link href={`/p/${project.publicToken}`} target="_blank">
                  <Button variant="secondary" className="shadow-sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Просмотр как исполнитель
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <Tabs defaultValue="offers" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
              <TabsTrigger 
                value="offers" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 text-base"
              >
                Полученные оферы ({project.offers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 text-base"
              >
                Детали ТЗ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="mt-8 animate-in">
              {project.offers.length === 0 ? (
                <EmptyState
                  icon={<Share2 className="w-10 h-10" />}
                  title="Оферов пока нет"
                  description="Поделитесь публичной ссылкой с исполнителями, чтобы начать получать предложения."
                />
              ) : (
                <OffersTable offers={project.offers} projectId={project.id} />
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-8 animate-in">
              <Card>
                <CardContent className="p-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold font-display mb-3">Описание проекта</h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{project.description}</p>
                  </div>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold font-display mb-3">Ожидаемые результаты</h3>
                      <p className="whitespace-pre-wrap text-muted-foreground">{project.expectedResult}</p>
                    </div>
                    {project.criteria && (
                      <div>
                        <h3 className="text-lg font-bold font-display mb-3">Критерии выбора</h3>
                        <ul className="space-y-2">
                          {(project.criteria as string[]).map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
