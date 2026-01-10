import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Ban, CheckCircle, KeyRound, Shield, ShieldOff, Search } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AdminUser = {
  id: number;
  username: string;
  role: string;
  isBlocked: boolean;
  blockedAt: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
};

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Минимум 6 символов"),
});

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [filterBlocked, setFilterBlocked] = useState<"all" | "blocked" | "active">("all");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  const blockMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Пользователь заблокирован" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось заблокировать", variant: "destructive" });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/unblock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Пользователь разблокирован" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось разблокировать", variant: "destructive" });
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Роль обновлена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось изменить роль", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetUserId(null);
      toast({ title: "Пароль сброшен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось сбросить пароль", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const filteredUsers = users.filter((u) => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBlocked === "blocked" && !u.isBlocked) return false;
    if (filterBlocked === "active" && u.isBlocked) return false;
    if (filterRole === "admin" && u.role !== "admin") return false;
    if (filterRole === "user" && u.role !== "user") return false;
    return true;
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Пользователи</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по логину..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterBlocked === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBlocked("all")}
              >
                Все
              </Button>
              <Button
                variant={filterBlocked === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBlocked("active")}
              >
                Активные
              </Button>
              <Button
                variant={filterBlocked === "blocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBlocked("blocked")}
              >
                Заблокированные
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRole("all")}
              >
                Все роли
              </Button>
              <Button
                variant={filterRole === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRole("admin")}
              >
                Админы
              </Button>
              <Button
                variant={filterRole === "user" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRole("user")}
              >
                Пользователи
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead>Входов</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? "Админ" : "Пользователь"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.isBlocked ? (
                        <Badge variant="destructive">Заблокирован</Badge>
                      ) : (
                        <Badge variant="outline">Активен</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(u.createdAt), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), "dd.MM.yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell>{u.loginCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {u.isBlocked ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => unblockMutation.mutate(u.id)}
                            title="Разблокировать"
                            data-testid={`button-unblock-${u.id}`}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => blockMutation.mutate(u.id)}
                            title="Заблокировать"
                            disabled={u.id === user.id}
                            data-testid={`button-block-${u.id}`}
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setResetUserId(u.id)}
                          title="Сбросить пароль"
                          data-testid={`button-reset-${u.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {u.role === "admin" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleRoleMutation.mutate({ userId: u.id, role: "user" })}
                            title="Убрать админа"
                            disabled={u.id === user.id}
                            data-testid={`button-demote-${u.id}`}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleRoleMutation.mutate({ userId: u.id, role: "admin" })}
                            title="Сделать админом"
                            data-testid={`button-promote-${u.id}`}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={resetUserId !== null} onOpenChange={() => setResetUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                if (resetUserId) {
                  resetPasswordMutation.mutate({ userId: resetUserId, newPassword: data.newPassword });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новый пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Минимум 6 символов" {...field} data-testid="input-new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetUserId(null)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending} data-testid="button-confirm-reset">
                  Сбросить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
