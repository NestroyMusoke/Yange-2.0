import { useState } from "react";
import {
  MULTIMODAL_CONTRACT_VERSION,
  type AnalysisImageRef,
  type GarmentAnalysisV1,
} from "@yange/contracts";
import type { EvidenceValue, Garment } from "@yange/domain";
import type { TestableMultimodalAnalyzer } from "../../aiRuntime";
import { ImageDropzone } from "../studio/ImageDropzone";
import type { CaptureQueue } from "../studio/useCaptureQueue";

interface CareEvidenceCaptureProps {
  garment: Garment;
  queue: CaptureQueue;
  analyzer: TestableMultimodalAnalyzer;
  onConfirm(garment: Garment, washMethod: string): boolean;
  onDecline(): void;
}

function imageRef(asset: NonNullable<CaptureQueue["slots"]["care-label"]["asset"]>): AnalysisImageRef {
  return {
    assetId: asset.assetId,
    kind: asset.kind,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    byteLength: asset.byteLength,
    width: asset.width,
    height: asset.height,
  };
}

function confirmed<T>(value: T): EvidenceValue<T> {
  return { value, provenance: "user-confirmed", confidence: 1, reviewStatus: "confirmed" };
}

export function CareEvidenceCapture({ garment, queue, analyzer, onConfirm, onDecline }: CareEvidenceCaptureProps) {
  const slot = queue.slots["care-label"];
  const [analysis, setAnalysis] = useState<GarmentAnalysisV1 | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(): Promise<void> {
    if (!slot.asset) return;
    queue.setAnalysisStatus(["care-label"], "analyzing");
    setError(null);
    try {
      const result = await analyzer.analyze({
        contractVersion: MULTIMODAL_CONTRACT_VERSION,
        requestId: `mission-care-${crypto.randomUUID()}`,
        mode: "garment",
        images: [imageRef(slot.asset)],
      });
      if (result.mode !== "garment") throw new Error("The adapter returned the wrong analysis mode.");
      setAnalysis(result);
      queue.setAnalysisStatus(["care-label"], "ready");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Care-label analysis failed.";
      setError(message);
      queue.setAnalysisStatus(["care-label"], "failed", message);
    }
  }

  function confirmEvidence(): void {
    if (!analysis || !slot.asset) return;
    const updated: Garment = {
      ...garment,
      careLabelAssetId: slot.asset.assetId,
      careProfile: {
        wash: confirmed(analysis.careProfile.wash.value),
        dry: confirmed(analysis.careProfile.dry.value),
        iron: confirmed(analysis.careProfile.iron.value),
        bleach: confirmed(analysis.careProfile.bleach.value),
        notes: confirmed(analysis.careProfile.notes.value),
      },
      wearPolicy: { ...analysis.suggestedWearPolicy, source: "user-confirmed" },
    };
    onConfirm(updated, analysis.careProfile.wash.value);
  }

  return (
    <div className="evidence-relay-grid">
      <ImageDropzone
        kind="care-label"
        title={`${garment.name} care label`}
        description="Photograph the real label. The image stays in Yange's private media store; the agent receives only the fact you confirm."
        slot={slot}
        onFile={(file) => void queue.process("care-label", file)}
        onDemo={() => void queue.useDemo("care-label")}
        onRetry={() => void queue.retry("care-label")}
        onRemove={() => { void queue.remove("care-label"); setAnalysis(null); }}
      />
      <div className={`care-evidence-result ${analysis ? "has-analysis" : ""}`} aria-live="polite">
        {analysis ? (
          <>
            <span className="mission-eyebrow">Gemini extracted · you decide</span>
            <h3>{analysis.careProfile.wash.value.replaceAll("-", " ")}</h3>
            <dl>
              <div><dt>Dry</dt><dd>{analysis.careProfile.dry.value.replaceAll("-", " ")}</dd></div>
              <div><dt>Iron</dt><dd>{analysis.careProfile.iron.value.replaceAll("-", " ")}</dd></div>
              <div><dt>Bleach</dt><dd>{analysis.careProfile.bleach.value.replaceAll("-", " ")}</dd></div>
            </dl>
            <p>These facts do not become trusted wardrobe evidence until you confirm them.</p>
            <button type="button" className="primary-action" onClick={confirmEvidence}>Confirm label and continue agent</button>
          </>
        ) : (
          <>
            <span className="mission-eyebrow">Physical truth relay</span>
            <h3>The agent is waiting here.</h3>
            <p>One camera action bridges the open web, the browser agent and the garment in your hand.</p>
            <button type="button" className="primary-action" disabled={!slot.asset || slot.status === "analyzing"} onClick={() => void analyze()}>
              {slot.status === "analyzing" ? "Reading the care symbols…" : "Read this care label"}
            </button>
            {error && <p className="capture-error" role="alert">{error}</p>}
            <button type="button" className="quiet-action" onClick={onDecline}>I cannot verify this</button>
          </>
        )}
      </div>
    </div>
  );
}
