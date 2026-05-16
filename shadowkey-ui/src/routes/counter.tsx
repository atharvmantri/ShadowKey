import { createFileRoute } from '@tanstack/react-router';
import { shadowkey } from '@/pages/shadowkey';

export const Route = createFileRoute('/shadowkey')({
  component: shadowkey,
});
