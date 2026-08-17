// Queue names — centralized so producers (services) and consumers
// (processors) never drift on a typo'd string.
export const QUEUE_AI_ANALYSIS = 'ai-analysis';
export const QUEUE_REPORT_GENERATION = 'report-generation';
export const QUEUE_NOTIFICATIONS = 'notifications';
export const QUEUE_ATTACHMENT_PROCESSING = 'attachment-processing';

export const JOB_ANALYZE_LOG = 'analyze-log'; // categorize, score, embed a single new log
export const JOB_DETECT_PATTERNS = 'detect-patterns'; // periodic clustering across a user's logs
export const JOB_GENERATE_REPORT = 'generate-report'; // daily/weekly/monthly AIReport
export const JOB_SEND_NOTIFICATION = 'send-notification';
export const JOB_TRANSCRIBE_AUDIO = 'transcribe-audio';
export const JOB_PROCESS_IMAGE = 'process-image';
