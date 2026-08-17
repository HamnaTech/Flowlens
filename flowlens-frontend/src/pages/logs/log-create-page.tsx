import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { frustrationLogsApi } from '@/api/frustration-logs.api';
import { getErrorMessage } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogForm, type LogFormValues } from './log-form';

export function LogCreatePage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (values: LogFormValues) => frustrationLogsApi.create(values),
    onSuccess: (log) => {
      toast.success('Frustration logged. AI analysis is running in the background.');
      navigate(`/logs/${log.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link to="/logs" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to logs
      </Link>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-display">Log a frustration</CardTitle>
          </CardHeader>
          <CardContent>
            <LogForm onSubmit={(values) => createMutation.mutate(values)} isSubmitting={createMutation.isPending} submitLabel="Save log" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
