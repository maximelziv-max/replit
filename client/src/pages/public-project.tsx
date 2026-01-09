import { usePublicProject } from "@/hooks/use-projects";
import { useCreateOffer } from "@/hooks/use-offers";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema, TEMPLATES, type TemplateType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, DollarSign, Loader2, Send, Video, Palette, TrendingUp, Code, PenLine, Puzzle, Sparkles, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Video, Palette, TrendingUp, Code, PenLine, Puzzle
};
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AIOfferImproveResult {
  suggested_offer: {
    approach: string;
    guarantees: string;
    risks: string;
  };
  improvements: string[];
}

interface AIOfferReviewResult {
  improvements: string[];
  missing_info: string[];
}

function getOfferHints(templateType: string | null | undefined) {
  const type = (templateType || "universal") as TemplateType;
  return TEMPLATES[type]?.offerHints || TEMPLATES.universal.offerHints;
}

export default function PublicProject() {
  const [, params] = useRoute("/p/:token");
  const token = params?.token || "";
  const { data: project, isLoading: isLoadingProject } = usePublicProject(token);
  const { mutate: createOffer, isPending: isSubmitting, isSuccess } = useCreateOffer(token);
  const [activeSection, setActiveSection] = useState<'brief' | 'offer'>('brief');
  const [aiImproveResult, setAiImproveResult] = useState<AIOfferImproveResult | null>(null);
  const [aiReviewResult, setAiReviewResult] = useState<AIOfferReviewResult | null>(null);
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  const { toast } = useToast();
  const offerHints = getOfferHints(project?.templateType);

  const form = useForm({
    resolver: zodResolver(insertOfferSchema),
    defaultValues: {
      freelancerName: "",
      contact: "",
      portfolioLinks: "",
      experience: "",
      skills: "",
      approach: "",
      deadline: "",
      price: "",
      guarantees: "",
      risks: "",
    },
  });

  const improveMutation = useMutation({
    mutationFn: async (data: {
      project: { title: string; description: string; result?: string };
      offer: { approach: string; deadline: string; price: string; guarantees?: string; risks?: string };
      template: string;
    }) => {
      const res = await apiRequest("POST", "/api/ai/offer/improve", data);
      return res.json() as Promise<AIOfferImproveResult>;
    },
    onSuccess: (data) => {
      setAiImproveResult(data);
      setShowImproveDialog(true);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message || "Не удалось улучшить офер", variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: {
      project: { title: string; description: string; result?: string };
      offer: { approach: string; deadline: string; price: string; guarantees?: string; risks?: string };
      template: string;
    }) => {
      const res = await apiRequest("POST", "/api/ai/offer/review", data);
      return res.json() as Promise<AIOfferReviewResult>;
    },
    onSuccess: (data) => {
      setAiReviewResult(data);
      setShowReviewDialog(true);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message || "Не удалось получить советы", variant: "destructive" });
    },
  });

  const handleAIImprove = () => {
    const values = form.getValues();
    improveMutation.mutate({
      project: {
        title: project?.title || "",
        description: project?.description || "",
        result: project?.expectedResult || "",
      },
      offer: {
        approach: values.approach,
        deadline: values.deadline,
        price: values.price,
        guarantees: values.guarantees,
        risks: values.risks,
      },
      template: project?.templateType || "universal",
    });
  };

  const handleAIReview = () => {
    const values = form.getValues();
    reviewMutation.mutate({
      project: {
        title: project?.title || "",
        description: project?.description || "",
        result: project?.expectedResult || "",
      },
      offer: {
        approach: values.approach,
        deadline: values.deadline,
        price: values.price,
        guarantees: values.guarantees,
        risks: values.risks,
      },
      template: project?.templateType || "universal",
    });
  };

  const applyImprovement = () => {
    if (aiImproveResult) {
      form.setValue("approach", aiImproveResult.suggested_offer.approach);
      form.setValue("guarantees", aiImproveResult.suggested_offer.guarantees);
      form.setValue("risks", aiImproveResult.suggested_offer.risks);
      setShowImproveDialog(false);
      toast({ title: "Улучшения применены" });
    }
  };

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
          <h1 className="text-2xl font-bold mb-2">Проект не найден</h1>
          <p className="text-muted-foreground">Ссылка может быть недействительной или срок ее действия истек.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4">
        <Card className="max-w-lg w-full shadow-2xl border-0">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4 text-foreground">Офер отправлен!</h2>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Ваше предложение успешно отправлено заказчику. Ожидайте ответа — он свяжется с вами, если ваше предложение его заинтересует.
            </p>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <h4 className="font-semibold mb-2 text-sm">Что дальше?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Заказчик получит уведомление о вашем офере</li>
                  <li>• Он свяжется с вами по указанным контактам</li>
                  <li>• Обычно ответ приходит в течение 1-3 дней</li>
                </ul>
              </div>
            </div>
          </CardContent>
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
            Отправить предложение
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-8 animate-in">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">ТЗ проекта</Badge>
              {project.templateType && project.templateType !== "universal" && (() => {
                const template = TEMPLATES[project.templateType as TemplateType];
                const IconComponent = template ? TEMPLATE_ICONS[template.iconName] : null;
                return (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    {template?.name}
                  </Badge>
                );
              })()}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6 text-foreground">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-muted-foreground text-sm font-medium">
              <span className="flex items-center bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                Срок: {project.deadline}
              </span>
              {project.budget && (
                <span className="flex items-center bg-white px-3 py-1.5 rounded-full border shadow-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-primary" />
                  Бюджет: {project.budget}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-none shadow-md">
                <CardContent className="p-8">
                  <h3 className="text-lg font-bold font-display mb-4">Описание</h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground text-lg">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold font-display">Требования</h3>
                <div className="grid gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Ожидаемые результаты</CardTitle>
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
                    <CardTitle className="text-primary">Критерии выбора</CardTitle>
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
              <h2 className="text-3xl font-display font-bold mb-3">Отправьте ваш офер</h2>
              <p className="text-muted-foreground">Готовы взяться за этот проект? Заполните форму ниже.</p>
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
                            <FormLabel>Ваше имя</FormLabel>
                            <FormControl>
                              <Input placeholder="Иван Иванов" {...field} data-testid="input-offer-name" />
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
                            <FormLabel>Контактная информация</FormLabel>
                            <FormControl>
                              <Input placeholder="Email, Telegram или телефон" {...field} data-testid="input-offer-contact" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="portfolioLinks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Портфолио / профили</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ссылки на GitHub / HH / LinkedIn / сайт / Notion (можно несколько)"
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ''}
                              data-testid="input-offer-portfolio"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Рекомендуем добавить для повышения доверия</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Опыт и релевантные проекты</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Коротко: опыт, похожие задачи, 2–3 примера проектов"
                              className="min-h-[100px]"
                              maxLength={600}
                              {...field} 
                              value={field.value || ''}
                              data-testid="input-offer-experience"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Стек / ключевые навыки</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Напр. Python, FastAPI, PostgreSQL, Docker"
                              maxLength={200}
                              {...field} 
                              value={field.value || ''}
                              data-testid="input-offer-skills"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="approach"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ваш подход</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={offerHints.approach}
                              className="min-h-[150px]"
                              {...field} 
                              data-testid="input-offer-approach"
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
                            <FormLabel>Общая стоимость</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={offerHints.price} 
                                {...field} 
                                data-testid="input-offer-price"
                              />
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
                            <FormLabel>Срок выполнения</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={offerHints.deadline} 
                                {...field} 
                                data-testid="input-offer-deadline"
                              />
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
                          <FormLabel>Гарантии (необязательно)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={offerHints.guarantees}
                              className="min-h-[80px]"
                              {...field} 
                              data-testid="input-offer-guarantees"
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
                          <FormLabel>Возможные риски (необязательно)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={offerHints.risks}
                              className="min-h-[80px]"
                              {...field} 
                              data-testid="input-offer-risks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleAIImprove}
                        disabled={improveMutation.isPending}
                        data-testid="button-ai-improve-offer"
                      >
                        {improveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Улучшить текст
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleAIReview}
                        disabled={reviewMutation.isPending}
                        data-testid="button-ai-review-offer"
                      >
                        {reviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                        Совет по оферу
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full text-base font-semibold shadow-lg shadow-primary/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Отправить офер
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

      <Dialog open={showImproveDialog} onOpenChange={setShowImproveDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предложенные улучшения</DialogTitle>
            <DialogDescription>Просмотрите предложенные изменения и примените, если они вам подходят.</DialogDescription>
          </DialogHeader>
          {aiImproveResult && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Улучшенный подход:</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{aiImproveResult.suggested_offer.approach}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Улучшенные гарантии:</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{aiImproveResult.suggested_offer.guarantees}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Улучшенные риски:</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{aiImproveResult.suggested_offer.risks}</p>
              </div>
              {aiImproveResult.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Рекомендации:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {aiImproveResult.improvements.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImproveDialog(false)}>Отмена</Button>
            <Button onClick={applyImprovement} data-testid="button-apply-offer-improvement">Применить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Советы по оферу</DialogTitle>
            <DialogDescription>Рекомендации для улучшения вашего предложения.</DialogDescription>
          </DialogHeader>
          {aiReviewResult && (
            <div className="space-y-4">
              {aiReviewResult.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Рекомендации:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {aiReviewResult.improvements.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {aiReviewResult.missing_info.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Что ещё добавить:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {aiReviewResult.missing_info.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {aiReviewResult.improvements.length === 0 && aiReviewResult.missing_info.length === 0 && (
                <p className="text-sm text-muted-foreground">Ваш офер выглядит хорошо!</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowReviewDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
