import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, Plus, Users } from 'lucide-react';
import { organizationsApi } from '@/api/organizations.api';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/empty-error-states';

function CreateOrgDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  const mutation = useMutation({
    mutationFn: (values: { name: string }) => organizationsApi.create(values),
    onSuccess: () => {
      toast.success('Organization created.');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" placeholder="Acme Inc." {...register('name', { required: true, minLength: 2, maxLength: 100 })} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OrganizationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: () => organizationsApi.list() });
  const orgs = orgsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Teams you belong to.</p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New organization
        </Button>
      </div>

      {orgsQuery.isLoading ? (
        <ListSkeleton rows={3} />
      ) : orgsQuery.isError ? (
        <ErrorState message={getErrorMessage(orgsQuery.error)} onRetry={() => orgsQuery.refetch()} />
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create one to collaborate on frustration tracking with your team."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>Create organization</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Link to={`/organizations/${org.id}`} className="block">
                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      {org.myRole && (
                        <Badge variant={org.myRole === 'OWNER' ? 'default' : 'outline'}>{org.myRole}</Badge>
                      )}
                    </div>
                    <p className="mt-3 font-semibold">{org.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {org._count?.members ?? 0} members
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {org._count?.frustrationLogs ?? 0} logs
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateOrgDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}