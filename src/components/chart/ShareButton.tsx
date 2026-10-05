import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href;
    // Native share sheet on phones; clipboard everywhere else
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User closed the share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </button>
  );
}
