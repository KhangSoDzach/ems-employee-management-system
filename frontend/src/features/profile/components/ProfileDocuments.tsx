import { ReactNode } from "react";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface ProfileDocumentsProps {
  documentsContent: ReactNode;
}

export function ProfileDocuments({ documentsContent }: ProfileDocumentsProps) {
  return (
    <div className="content-card h-min">
      <h3 className="section-title">{SYSTEM_MESSAGES.PROFILE.DOCS_SECTION}</h3>
      <div className="space-y-3">{documentsContent}</div>
    </div>
  );
}
