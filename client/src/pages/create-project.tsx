import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, TEMPLATES, TEMPLATE_TYPES, type TemplateType } from "@shared/schema";
import { useCreateProject } from "@/hooks/use-projects";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Plus, Trash2, Video, Palette, TrendingUp, Code, PenLine, Puzzle } from "lucide-react";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Video, Palette, TrendingUp, Code, PenLine, Puzzle
};
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function CreateProject() {
  const { mutate: createProject, isPending } = useCreateProject();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("universal");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [customCriteria, setCustomCriteria] = useState<string[]>([]);
  const [newCriteria, setNewCriteria] = useState("");

  const template = TEMPLATES[selectedTemplate];

  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      templateType: "universal",
      title: "",
      description: "",
      expectedResult: "",
      deadline: "",
      budget: "",
      criteria: [] as string[],
    },
  });

  useEffect(() => {
    setSelectedCriteria([...template.defaultCriteria]);
    setCustomCriteria([]);
    form.setValue("templateType", selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    const allCriteria = [...selectedCriteria, ...customCriteria];
    form.setValue("criteria", allCriteria);
  }, [selectedCriteria, customCriteria]);

  const handleCriteriaToggle = (criterion: string, checked: boolean) => {
    if (checked) {
      setSelectedCriteria(prev => [...prev, criterion]);
    } else {
      setSelectedCriteria(prev => prev.filter(c => c !== criterion));
    }
  };

  const handleAddCustomCriteria = () => {
    if (newCriteria.trim() && !customCriteria.includes(newCriteria.trim())) {
      setCustomCriteria(prev => [...prev, newCriteria.trim()]);
      setNewCriteria("");
    }
  };

  const handleRemoveCustomCriteria = (index: number) => {
    setCustomCriteria(prev => prev.filter((_, i) => i !== index));
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
                <ArrowLeft className="w-4 h-4 mr-2" /> Вернуться в панель
              </Button>
            </Link>
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Создать новое ТЗ</h1>
            <p className="text-muted-foreground">Выберите тип проекта и заполните требования.</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Выберите тип проекта</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATE_TYPES.map((type) => {
                const t = TEMPLATES[type];
                const IconComponent = TEMPLATE_ICONS[t.iconName];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedTemplate(type)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      selectedTemplate === type
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover-elevate"
                    )}
                    data-testid={`template-${type}`}
                  >
                    {IconComponent && <IconComponent className="w-6 h-6 mb-2 text-primary" />}
                    <span className="font-medium">{t.name}</span>
                  </button>
                );
              })}
            </div>
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
                        <FormLabel className="text-base font-semibold">Название проекта</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={template.projectHints.title} 
                            className="h-12" 
                            {...field} 
                            data-testid="input-title"
                          />
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
                        <FormLabel className="text-base font-semibold">Описание проекта</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={template.projectHints.description}
                            className="min-h-[150px] resize-none" 
                            {...field} 
                            data-testid="input-description"
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
                          <FormLabel className="text-base font-semibold">Сроки</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: 2 недели или до 31 декабря" 
                              {...field} 
                              data-testid="input-deadline"
                            />
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
                          <FormLabel className="text-base font-semibold">Бюджет (необязательно)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: 50,000 - 100,000 руб." 
                              {...field} 
                              value={field.value || ''} 
                              data-testid="input-budget"
                            />
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
                        <FormLabel className="text-base font-semibold">Ожидаемые результаты</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={template.projectHints.expectedResult}
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="input-expected-result"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel className="text-base font-semibold">Критерии выбора исполнителя</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {template.defaultCriteria.map((criterion) => (
                        <label
                          key={criterion}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedCriteria.includes(criterion) 
                              ? "bg-primary/5 border-primary/30" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            checked={selectedCriteria.includes(criterion)}
                            onCheckedChange={(checked) => handleCriteriaToggle(criterion, !!checked)}
                            data-testid={`checkbox-criteria-${criterion.slice(0, 10)}`}
                          />
                          <span className="text-sm">{criterion}</span>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">Добавить свой критерий:</p>
                      <div className="flex gap-2">
                        <Input 
                          value={newCriteria} 
                          onChange={(e) => setNewCriteria(e.target.value)}
                          placeholder="Например: опыт работы с API"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCriteria())}
                          data-testid="input-custom-criteria"
                        />
                        <Button type="button" onClick={handleAddCustomCriteria} variant="secondary">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {customCriteria.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {customCriteria.map((item, index) => (
                            <div key={index} className="bg-primary/10 px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
                              <span>{item}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveCustomCriteria(index)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="px-8 shadow-lg shadow-primary/20"
                      disabled={isPending}
                      data-testid="button-create-project"
                    >
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Создать ТЗ
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
