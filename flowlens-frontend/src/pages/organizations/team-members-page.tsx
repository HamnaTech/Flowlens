import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, LogOut, Trash2, UserPlus } from 'lucide-react';
import { teamsApi } from '@/api/organizations.api';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState, ListSkeleton } from '@/components/empty-error-states';
import { initials, formatDate } from '@/lib/utils';
import type { OrgRole } from '@/types/api';

function RoleBadge({ role }: { role: OrgRole }) {
  const styles = {
    OWNER: 'bg-primary/10 text-primary border-primary/20',
    ADMIN: 'bg-secondary/10 text-secondary border-secondary/20',
    MEMBER: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[role]}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

export function TeamMembersPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);

  const membersQuery = useQuery({
    queryKey: ['team', organizationId, 'members'],
    queryFn: () => teamsApi.listMembers(organizationId!),
    enabled: !!organizationId,
  });

  const invitesQuery = useQuery({
    queryKey: ['team', organizationId, 'invites'],
    queryFn: () => teamsApi.listInvites(organizationId!),
    enabled: !!organizationId,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(organizationId!, userId),
    onSuccess: () => {
      toast.success('Member removed.');
      queryClient.invalidateQueries({ queryKey: ['team', organizationId] });
      setRemoveTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const inviteForm = useForm<{ email: string; role: OrgRole }>({ defaultValues: { role: 'MEMBER' } });
  const inviteMutation = useMutation({
    mutationFn: (values: { email: string; role: OrgRole }) => teamsApi.invite(organizationId!, values),
    onSuccess: () => {
      toast.success('Invite sent.');
      queryClient.invalidateQueries({ queryKey: ['team', organizationId, 'invites'] });
      setInviteOpen(false);
      inviteForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const members = membersQuery.data ?? [];
  // The org detail endpoint doesn't return the caller's own role directly —
  // deriving it from the real membership list rather than guessing/hiding
  // admin controls incorrectly.
  const myMembership = members.find((m) => m.userId === user?.id);
  const canManage = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  if (membersQuery.isLoading) return <ListSkeleton rows={4} />;
  if (membersQuery.isError) return <ErrorState message={getErrorMessage(membersQuery.error)} onRetry={() => membersQuery.refetch()} />;

  return (
    <div className="space-y-4">
      <Link to="/organizations" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to organizations
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Team members</h2>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Invite member
            </Button>
          )}
        </div>

        <Card className="mt-4">
          <CardContent className="divide-y divide-border p-0">
            {members.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 text-sm font-semibold text-secondary">
                  {initials(m.user.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.user.displayName}
                    {m.userId === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  {m.user.lastLoginAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground/70">Last active {formatDate(m.user.lastLoginAt)}</p>
                  )}
                </div>
                <RoleBadge role={m.role} />
                {canManage && m.role !== 'OWNER' && m.userId !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemoveTarget({ userId: m.userId, name: m.user.displayName })}
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-destructive" />
                  </Button>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {canManage && !!invitesQuery.data?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {invitesQuery.data.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 text-sm">
                <span className="text-muted-foreground">{inv.email}</span>
                <Badge variant="outline">{inv.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {myMembership && myMembership.role !== 'OWNER' && (
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => teamsApi.leave(organizationId!).then(() => toast.success('You left the organization.'))}
        >
          <LogOut className="h-4 w-4" /> Leave organization
        </Button>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={inviteForm.handleSubmit((v) => inviteMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...inviteForm.register('email', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name}?`}
        description="They'll lose access to this organization's team logs and reports."
        confirmLabel="Remove"
        isLoading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.userId)}
      />
    </div>
  );
}