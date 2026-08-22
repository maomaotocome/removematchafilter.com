import { m } from '@/paraglide/messages.js';
import { VideoEvidence as VideoEvidenceComponent } from '@/components/matcha/video-evidence';

export function VideoEvidence() {
  return (
    <VideoEvidenceComponent
      copy={{
        eyebrow: m['video.evidence_eyebrow'](),
        title: m['video.evidence_title'](),
        intro: m['video.evidence_intro'](),
        beforeLabel: m['video.evidence_before_label'](),
        beforeBody: m['video.evidence_before_body'](),
        afterLabel: m['video.evidence_after_label'](),
        afterBody: m['video.evidence_after_body'](),
        note: m['video.evidence_note'](),
      }}
    />
  );
}
