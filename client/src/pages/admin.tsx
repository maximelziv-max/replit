import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FolderOpen, FileText, Activity, ArrowLeft, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState, useEffect } from "react";

type AdminStats = {
  totals: { users: number; projects: number; offers: number };
  activeUsers: number;
  series: {
    usersPerDay: Array<{ date: string; count: number }>;
    projectsPerDay: Array<{ date: string; count: number }>;
    offersPerDay: Array<{ date: string; count: number }>;
    eventsPerDay: Array<Record<string, number | string>>;
  };
  recentEvents: Array<{
    id: number;
    userId: number | null;
    eventType: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  user_login: "Вход",
  project_created: "Проект создан",
  offer_submitted: "Офер отправлен",
  offer_deleted: "Офер удалён",
  offer_status_changed: "Статус изменён",
  ai_project_improve: "AI улучшение ТЗ",
  ai_project_review: "AI проверка ТЗ",
  ai_offer_improve: "AI улучшение офера",
  ai_offer_review: "AI проверка офера",
};

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Панель администратора</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/admin/users")} data-testid="button-users">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.users || 0}</div>
            <p className="text-xs text-muted-foreground">Активных за {days} дней: {stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Проектов</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.projects || 0}</div>
            <p className="text-xs text-muted-foreground">За {days} дней: {stats?.series.projectsPerDay.reduce((s, d) => s + d.count, 0) || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Оферов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.offers || 0}</div>
            <p className="text-xs text-muted-foreground">За {days} дней: {stats?.series.offersPerDay.reduce((s, d) => s + d.count, 0) || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активность</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentEvents.length || 0}</div>
            <p className="text-xs text-muted-foreground">Последних событий</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="7" onValueChange={(v) => setDays(Number(v))}>
        <TabsList>
          <TabsTrigger value="7">7 дней</TabsTrigger>
          <TabsTrigger value="30">30 дней</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Новые пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.series.usersPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd.MM")} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => format(new Date(v), "d MMMM", { locale: ru })} />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Пользователи" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Проекты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.series.projectsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd.MM")} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => format(new Date(v), "d MMMM", { locale: ru })} />
                  <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Проекты" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Оферы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.series.offersPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd.MM")} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => format(new Date(v), "d MMMM", { locale: ru })} />
                  <Area type="monotone" dataKey="count" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} name="Оферы" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Активность по типам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.series.eventsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v as string), "dd.MM")} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => format(new Date(v as string), "d MMMM", { locale: ru })} />
                  <Legend />
                  <Area type="monotone" dataKey="user_login" stackId="1" stroke="#8884d8" fill="#8884d8" name="Входы" />
                  <Area type="monotone" dataKey="project_created" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Проекты" />
                  <Area type="monotone" dataKey="offer_submitted" stackId="1" stroke="#ffc658" fill="#ffc658" name="Оферы" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Последняя активность</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Событие</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentEvents.slice(0, 20).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(event.createdAt), "dd.MM HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.userId ? `ID: ${event.userId}` : "Аноним"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {event.metadata ? JSON.stringify(event.metadata) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
