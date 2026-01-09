import { useState, useMemo, useEffect } from "react";
import { type Offer, OFFER_STATUSES, type OfferStatus } from "@shared/schema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  X,
  Trash2,
  LayoutGrid,
  TableIcon,
  CheckCircle2,
  Link2,
  Briefcase,
  Code2,
  Eye,
  Loader2,
  List,
  ArrowUpDown,
  Copy,
  MessageCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "cards" | "table" | "list";
type SortField = "date" | "price" | "deadline";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortField, string> = {
  date: "По дате",
  price: "По цене",
  deadline: "По сроку",
};

function extractNumber(str: string): number {
  const match = str.match(/[\d\s]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/\s/g, ""), 10) || 0;
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  new: "Новый",
  shortlist: "Шорт-лист",
  rejected: "Отклонён",
};

const STATUS_COLORS: Record<OfferStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shortlist: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface OffersTableProps {
  offers: Offer[];
  projectId: number;
}

export function OffersTable({ offers, projectId }: OffersTableProps) {
  const storageKey = `offers_view_mode_project_${projectId}`;
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "cards" || saved === "table" || saved === "list") return saved;
    return "table";
  });
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openOffer, setOpenOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(storageKey, viewMode);
  }, [viewMode, storageKey]);

  useEffect(() => {
    if (openOffer) {
      const updatedOffer = offers.find(o => o.id === openOffer.id);
      if (updatedOffer) {
        setOpenOffer(updatedOffer);
      } else {
        setOpenOffer(null);
      }
    }
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (statusFilter === "all") return offers;
    return offers.filter((o) => o.status === statusFilter);
  }, [offers, statusFilter]);

  const sortedOffers = useMemo(() => {
    const sorted = [...filteredOffers].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.id - b.id;
      } else if (sortField === "price") {
        cmp = extractNumber(a.price) - extractNumber(b.price);
      } else if (sortField === "deadline") {
        cmp = a.deadline.localeCompare(b.deadline);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredOffers, sortField, sortDir]);

  const copyContact = (contact: string) => {
    navigator.clipboard.writeText(contact);
    toast({ title: "Контакт скопирован" });
  };

  const allSelected = filteredOffers.length > 0 && filteredOffers.every((o) => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedOffers.map((o) => o.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ offerIds, status }: { offerIds: number[]; status: OfferStatus }) => {
      return apiRequest("PATCH", "/api/offers/bulk/status", { offerIds, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      clearSelection();
      toast({ title: "Статусы обновлены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить статусы", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (offerIds: number[]) => {
      return apiRequest("DELETE", "/api/offers/bulk", { offerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      clearSelection();
      setDeleteDialogOpen(false);
      if (openOffer && selectedIds.has(openOffer.id)) {
        setOpenOffer(null);
      }
      toast({ title: "Оферы удалены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить оферы", variant: "destructive" });
    },
  });

  const singleDeleteMutation = useMutation({
    mutationFn: async (offerId: number) => {
      return apiRequest("DELETE", `/api/offers/${offerId}`, {});
    },
    onSuccess: (_, deletedOfferId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setSingleDeleteId(null);
      if (openOffer && openOffer.id === deletedOfferId) {
        setOpenOffer(null);
      }
      toast({ title: "Офер удалён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить офер", variant: "destructive" });
    },
  });

  const singleStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: OfferStatus }) => {
      return apiRequest("PATCH", `/api/offers/${offerId}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      if (openOffer && openOffer.id === variables.offerId) {
        setOpenOffer({ ...openOffer, status: variables.status });
      }
      toast({ title: "Статус обновлён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    },
  });

  const handleBulkStatus = (status: OfferStatus) => {
    bulkStatusMutation.mutate({ offerIds: Array.from(selectedIds), status });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  const isPending = bulkStatusMutation.isPending || bulkDeleteMutation.isPending || singleDeleteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OfferStatus | "all")}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {OFFER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort-field">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortField[]).map((s) => (
                <SelectItem key={s} value={s}>{SORT_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            data-testid="button-sort-dir"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">Вид:</span>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            data-testid="button-view-table"
          >
            <TableIcon className="w-4 h-4 mr-1" />
            Таблица
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4 mr-1" />
            Список
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Карточки
          </Button>
        </div>
      </div>

      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border sticky top-0 z-10">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatus("shortlist")}
            disabled={isPending}
            data-testid="button-bulk-shortlist"
          >
            <Star className="w-4 h-4 mr-1" />
            В шорт-лист
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatus("rejected")}
            disabled={isPending}
            data-testid="button-bulk-reject"
          >
            <X className="w-4 h-4 mr-1" />
            Отклонить
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Удалить
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} data-testid="button-clear-selection">
            Снять выделение
          </Button>
          {isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        </div>
      )}

      {viewMode === "table" && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead className="min-w-[180px]">Подход</TableHead>
                <TableHead>Гарантии</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOffers.map((offer) => (
                <TableRow key={offer.id} data-testid={`row-offer-${offer.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(offer.id)}
                      onCheckedChange={() => toggleSelect(offer.id)}
                      data-testid={`checkbox-offer-${offer.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{offer.freelancerName}</div>
                      {offer.skills && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{offer.skills}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm truncate max-w-[140px]">{offer.contact}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => { e.stopPropagation(); copyContact(offer.contact); }}
                        title="Скопировать контакт"
                        data-testid={`button-copy-contact-${offer.id}`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary whitespace-nowrap">
                    {offer.price || "По договорённости"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {offer.deadline || "Не указан"}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                      {offer.approach || "Не описан"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-[150px]">
                      {offer.guarantees || "Без гарантий"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setOpenOffer(offer)}
                        title="Посмотреть оффер"
                        data-testid={`button-view-offer-${offer.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSingleDeleteId(offer.id)}
                        title="Удалить"
                        data-testid={`button-delete-offer-${offer.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-list-select-all"
            />
            <span className="text-sm text-muted-foreground">Выбрать все</span>
          </div>
          {sortedOffers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover-elevate cursor-pointer"
              onClick={() => setOpenOffer(offer)}
              data-testid={`list-offer-${offer.id}`}
            >
              <Checkbox
                checked={selectedIds.has(offer.id)}
                onCheckedChange={() => toggleSelect(offer.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
                data-testid={`checkbox-list-offer-${offer.id}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium">{offer.freelancerName}</span>
                  {offer.skills && (
                    <span className="text-xs text-muted-foreground">• {offer.skills.slice(0, 30)}{offer.skills.length > 30 ? "..." : ""}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[offer.status as OfferStatus]}`}>
                    {STATUS_LABELS[offer.status as OfferStatus]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{offer.contact}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{offer.approach || "Подход не описан"}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-primary">{offer.price || "Договорная"}</div>
                <div className="text-xs text-muted-foreground">{offer.deadline || "Срок не указан"}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setSingleDeleteId(offer.id);
                }}
                title="Удалить"
                data-testid={`button-delete-list-offer-${offer.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {viewMode === "cards" && (
        <div className="grid gap-6">
          {sortedOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden border-l-4 border-l-primary/50 shadow-md" data-testid={`card-offer-${offer.id}`}>
              <CardHeader className="bg-muted/10 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(offer.id)}
                      onCheckedChange={() => toggleSelect(offer.id)}
                      className="mt-1"
                      data-testid={`checkbox-card-offer-${offer.id}`}
                    />
                    <div>
                      <h3 className="text-xl font-bold font-display">{offer.freelancerName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{offer.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[offer.status as OfferStatus]}`}>
                      {STATUS_LABELS[offer.status as OfferStatus]}
                    </span>
                    <div className="text-right ml-2">
                      <div className="text-lg font-bold text-primary">{offer.price || "По договорённости"}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Цена</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-start gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Портфолио</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.portfolioLinks || "Не указано"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Опыт</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.experience || "Не указан"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Code2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Навыки</h4>
                      <p className="text-sm text-muted-foreground">{offer.skills || "Не указаны"}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Подход к работе</h4>
                    <p className="whitespace-pre-wrap leading-relaxed line-clamp-3">{offer.approach || "Не описан"}</p>
                  </div>
                </div>
                <div className="space-y-4 bg-muted/20 p-6 rounded-lg h-fit">
                  <div>
                    <h4 className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Предлагаемый срок</h4>
                    <p className="font-medium">{offer.deadline || "Не указан"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Гарантии</h4>
                    <p className="text-sm">{offer.guarantees || "Без гарантий"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => setOpenOffer(offer)} data-testid={`button-view-card-offer-${offer.id}`}>
                      Подробнее
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setSingleDeleteId(offer.id)}
                      data-testid={`button-delete-card-offer-${offer.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!openOffer} onOpenChange={() => setOpenOffer(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {openOffer && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">{openOffer.freelancerName}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <span>{openOffer.contact}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyContact(openOffer.contact)}
                    data-testid="button-copy-contact-sheet"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </SheetDescription>
              </SheetHeader>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => copyContact(openOffer.contact)}
                  className="flex-1"
                  data-testid="button-contact-offer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Связаться
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSingleDeleteId(openOffer.id)}
                  data-testid="button-delete-offer-sheet"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Цена:</span>
                    <span className="ml-2 text-xl font-bold text-primary">{openOffer.price || "По договорённости"}</span>
                  </div>
                  <Select
                    value={openOffer.status}
                    onValueChange={(v) => singleStatusMutation.mutate({ offerId: openOffer.id, status: v as OfferStatus })}
                    disabled={singleStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-[140px]" data-testid="select-offer-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Портфолио
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{openOffer.portfolioLinks || "Не указано"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Опыт
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{openOffer.experience || "Не указан"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Навыки
                  </h4>
                  <p className="text-sm text-muted-foreground">{openOffer.skills || "Не указаны"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Подход к работе</h4>
                  <p className="whitespace-pre-wrap text-muted-foreground">{openOffer.approach || "Не описан"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Предлагаемый срок</h4>
                  <p>{openOffer.deadline || "Не указан"}</p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1 text-sm flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Гарантии
                  </h4>
                  <p className="text-green-800 dark:text-green-300 text-sm">{openOffer.guarantees || "Без гарантий"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Возможные риски</h4>
                  <p className="text-sm text-muted-foreground">{openOffer.risks || "Не указаны"}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Связаться</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSingleDeleteId(openOffer.id);
                      setOpenOffer(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные оферы?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено {selectedIds.size} оферов. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={singleDeleteId !== null} onOpenChange={() => setSingleDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить офер?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => singleDeleteId && singleDeleteMutation.mutate(singleDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {singleDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
