import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
      <div className="bg-muted p-4 rounded-full mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="lg" className="shadow-lg shadow-primary/20">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
