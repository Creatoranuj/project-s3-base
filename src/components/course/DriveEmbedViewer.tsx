import { memo, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DriveEmbedViewerProps {
  url: string;
  title?: string;
}

/**
 * Smart Google Drive / PDF Viewer — Full-page, mobile-friendly
 */
const DriveEmbedViewer = memo(({ url, title }: DriveEmbedViewerProps) => {
  const { embedUrl, openUrl, isDrive, isPdf } = useMemo(() => {
    const isDriveLink = /drive\.google\.com/.test(url);
    const isPdfLink = /\.pdf($|\?)/i.test(url);

    if (isDriveLink) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch?.[1] || idParamMatch?.[1];

      if (fileId) {
        return {
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          openUrl: `https://drive.google.com/file/d/${fileId}/view`,
          isDrive: true,
          isPdf: false,
        };
      }
    }

    if (isPdfLink) {
      return { embedUrl: url, openUrl: url, isDrive: false, isPdf: true };
    }

    return { embedUrl: url, openUrl: url, isDrive: false, isPdf: false };
  }, [url]);

  if (!isDrive && !isPdf) return null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Action bar */}
      <div className="flex items-center justify-end px-3 py-1.5 bg-muted/50 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => window.open(openUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1" />
          Open Full Page
        </Button>
      </div>
      <iframe
        src={embedUrl}
        className="w-full border-0 flex-1"
        title={title || "Document Preview"}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
        loading="eager"
        style={{ height: '100dvh', minHeight: '70vh' }}
      />
    </div>
  );
});

DriveEmbedViewer.displayName = "DriveEmbedViewer";

export default DriveEmbedViewer;
