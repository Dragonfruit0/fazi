
import React, { useRef, useEffect } from 'react';

interface UIPreviewProps {
  html: string;
}

export const UIPreview: React.FC<UIPreviewProps> = ({ html }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { margin: 0; padding: 20px; overflow-x: hidden; background: #0f0f0f; color: white; height: 100vh; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="w-full h-full bg-[#0f0f0f] relative overflow-hidden">
      <iframe
        ref={iframeRef}
        title="UI Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts"
      />
    </div>
  );
};
