import { useProjectDetails } from "@/hooks/use-projects";
import { Sidebar } from "@/components/Sidebar";
import { Link, useRoute } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
  Link2,
  Briefcase,
  Code2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";

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
                <div className="grid gap-6">
                  {project.offers.map((offer) => (
                    <Card key={offer.id} className="overflow-hidden border-l-4 border-l-primary/50 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-muted/10 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold font-display">{offer.freelancerName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{offer.contact}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{offer.price}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Цена</div>
                          </div>
                        </div>
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-6 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                          {offer.portfolioLinks && (
                            <div className="flex items-start gap-2">
                              <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <h4 className="font-semibold mb-1 text-sm">Портфолио</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.portfolioLinks}</p>
                              </div>
                            </div>
                          )}
                          {offer.experience && (
                            <div className="flex items-start gap-2">
                              <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <h4 className="font-semibold mb-1 text-sm">Опыт</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.experience}</p>
                              </div>
                            </div>
                          )}
                          {offer.skills && (
                            <div className="flex items-start gap-2">
                              <Code2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <h4 className="font-semibold mb-1 text-sm">Навыки</h4>
                                <p className="text-sm text-muted-foreground">{offer.skills}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Подход к работе</h4>
                            <p className="whitespace-pre-wrap leading-relaxed">{offer.approach}</p>
                          </div>
                          {offer.guarantees && (
                            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1 text-sm flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Гарантии
                              </h4>
                              <p className="text-green-800 dark:text-green-300 text-sm">{offer.guarantees}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-6 bg-muted/20 p-6 rounded-lg h-fit">
                          <div>
                            <h4 className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Предлагаемый срок</h4>
                            <p className="font-medium">{offer.deadline}</p>
                          </div>
                          {offer.risks && (
                            <div>
                              <h4 className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Выявленные риски</h4>
                              <p className="text-sm text-muted-foreground">{offer.risks}</p>
                            </div>
                          )}
                          <Button className="w-full">Связаться</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
