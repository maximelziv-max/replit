import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOfferInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreateOffer(token: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOfferInput) => {
      const validated = api.offers.create.input.parse(data);
      const url = buildUrl(api.offers.create.path, { token });
      
      const res = await fetch(url, {
        method: api.offers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit offer");
      return api.offers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Offer Submitted",
        description: "The client will review your proposal shortly.",
      });
    },
    onError: (err) => {
      toast({
        title: "Submission Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
