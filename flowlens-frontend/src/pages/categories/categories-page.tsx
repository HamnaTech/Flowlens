import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { categoriesApi, type CreateCategoryInput } from '@/api/categories.api';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, ErrorState, CategorySkeleton } from '@/components/empty-error-states';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useCategoryStats } from './use-category-stats';
import { formatMinutes } from '@/lib/utils';
import type { Category } from '@/types/api';

const DEFAULT_COLOR = '#D14A2D';

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const { register, handleSubmit, reset } = useForm<CreateCategoryInput>({
    defaultValues: { name: category?.name ?? '', color: category?.color ?? DEFAULT_COLOR },
  });

  // `defaultValues` only applies on mount — reset whenever the dialog opens
  // so editing a different category (or creating a new one) always starts
  // from the correct values instead of stale ones from a previous edit.
  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '', color: category?.color ?? DEFAULT_COLOR });
    }
  }, [open, category, reset]);

  const mutation = useMutation({
    mutationFn: (values: CreateCategoryInput) => (isEditing ? categoriesApi.update(category.id, values) : categoriesApi.create(values)),
    onSuccess: () => {
      toast.success(isEditing ? 'Category updated.' : 'Category created.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name', { required: true, maxLength: 50 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="color"
                aria-label="Category color"
                className="h-9 w-12 cursor-pointer rounded-md border border-input"
                {...register('color')}
              />
              <Input {...register('color')} aria-label="Category color hex value" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list({ pageSize: 50 }) });
  const { statsFor, sampleSize } = useCategoryStats();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success('Category archived.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const categories = categoriesQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Organize your frustration logs into categories.
          {sampleSize > 0 && <span className="ml-1.5 text-xs">Analytics based on your {sampleSize} most recent logs.</span>}
        </p>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <CategorySkeleton count={6} />
      ) : categoriesQuery.isError ? (
        <ErrorState message={getErrorMessage(categoriesQuery.error)} onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create categories to organize your logs and spot patterns."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null);
                setFormOpen(true);
              }}
            >
              Create category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card className="group h-full transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <Tags className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {!cat.isSystem && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCategory(cat);
                              setFormOpen(true);
                            }}
                            aria-label="Edit category"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteTarget(cat)}
                            aria-label="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{cat.name}</p>
                    {cat.isSystem && <Badge variant="outline">Default</Badge>}
                  </div>
                  {(() => {
                    const stats = statsFor(cat.id);
                    if (stats.count === 0) {
                      return (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cat._count?.frustrationLogs ?? 0} log{cat._count?.frustrationLogs === 1 ? '' : 's'}
                        </p>
                      );
                    }
                    return (
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg friction</p>
                          <p className="font-mono text-sm font-semibold">{stats.avgFriction !== null ? stats.avgFriction.toFixed(0) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Time lost</p>
                          <p className="font-mono text-sm font-semibold">{formatMinutes(stats.minutesLost)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Of total</p>
                          <p className="font-mono text-sm font-semibold">{stats.percentOfTotal.toFixed(0)}%</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Archive "${deleteTarget?.name}"?`}
        description="It will no longer be selectable for new logs, but existing logs keep showing it."
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}