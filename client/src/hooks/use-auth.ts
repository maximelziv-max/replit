import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<string | null>(null);

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      setLoginError(null);
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка входа");
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      toast({
        title: "Добро пожаловать!",
        description: `Вы вошли как ${data.username}`,
      });
    },
    onError: (err: Error) => {
      setLoginError(err.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { 
        method: api.auth.logout.method,
        credentials: "include" 
      });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      toast({
        title: "Вы вышли",
        description: "До скорой встречи!",
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
