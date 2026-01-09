import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateProjectInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useMyProjects() {
  return useQuery({
    queryKey: [api.projects.listMy.path],
    queryFn: async () => {
      const res = await fetch(api.projects.listMy.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.listMy.responses[200].parse(await res.json());
    },
  });
}

export function useProjectDetails(id: number) {
  return useQuery({
    queryKey: [api.projects.getMine.path, id],
    queryFn: async () => {
      const url = buildUrl(api.projects.getMine.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.getMine.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function usePublicProject(token: string) {
  return useQuery({
    queryKey: [api.projects.getByToken.path, token],
    queryFn: async () => {
      const url = buildUrl(api.projects.getByToken.path, { token });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.getByToken.responses[200].parse(await res.json());
    },
    enabled: !!token,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const validated = api.projects.create.input.parse(data);
      const res = await fetch(api.projects.create.path, {
        method: api.projects.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create project");
      return api.projects.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.listMy.path] });
      toast({
        title: "Project Created",
        description: "Your brief is ready to share.",
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
