import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories.api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FrustrationLog, LogSource } from '@/types/api';

export interface LogFormValues {
  description: string;
  frustrationLevel: number;
  source: LogSource;
  estimatedMinutesLost?: number;
  categoryId?: string;
  location?: string;
}

const SOURCE_LABELS: Record<LogSource, string> = {
  TEXT: 'Text',
  VOICE: 'Voice note',
  SCREENSHOT: 'Screenshot',
  SCREEN_RECORDING: 'Screen recording',
};

export function LogForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  defaultValues?: Partial<LogFormValues>;
  onSubmit: (values: LogFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const categoriesQuery = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoriesApi.list({ pageSize: 50 }) });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<LogFormValues>({
    defaultValues: {
      description: '',
      frustrationLevel: 5,
      source: 'TEXT',
      ...defaultValues,
    },
  });

  const frustrationLevel = watch('frustrationLevel');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="description">What happened?</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="e.g. Standup ran 25 minutes over with no agenda"
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 3, message: 'At least 3 characters' },
            maxLength: { value: 2000, message: 'Max 2000 characters' },
          })}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {(categoriesQuery.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SOURCE_LABELS) as LogSource[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="frustrationLevel">Frustration level</Label>
          <span className="font-mono text-sm font-semibold text-primary">{frustrationLevel}/10</span>
        </div>
        <input
          id="frustrationLevel"
          type="range"
          min={1}
          max={10}
          className="w-full accent-primary"
          {...register('frustrationLevel', { valueAsNumber: true, required: true, min: 1, max: 10 })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="estimatedMinutesLost">Minutes lost (optional)</Label>
          <Input
            id="estimatedMinutesLost"
            type="number"
            min={0}
            max={1440}
            {...register('estimatedMinutesLost', { valueAsNumber: true, min: 0, max: 1440 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location (optional)</Label>
          <Input id="location" placeholder="e.g. Zoom, Office" {...register('location', { maxLength: 200 })} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

export function logToFormValues(log: FrustrationLog): LogFormValues {
  return {
    description: log.description,
    frustrationLevel: log.frustrationLevel,
    source: log.source,
    estimatedMinutesLost: log.estimatedMinutesLost ?? undefined,
    categoryId: log.categoryId ?? undefined,
    location: log.location ?? undefined,
  };
}
