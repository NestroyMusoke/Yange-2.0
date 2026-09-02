import { useEffect, useRef, useState } from "react";
import {
  MULTIMODAL_CONTRACT_VERSION,
  type AnalysisImageRef,
  type LookDnaAnalysisV1,
} from "@yange/contracts";
import type { TestableMultimodalAnalyzer } from "../../aiRuntime";
import type { LookDna } from "@yange/domain";
import { YangeText, YangeWordmark } from "../brand/YangeWordmark";
import { ImageDropzone } from "./ImageDropzone";
import type { CaptureQueue } from "./useCaptureQueue";
import { fetchWebInspirationFile, type WebInspirationReference } from "../webmcp/webInspiration";

interface LookDnaPanelProps {
  queue: CaptureQueue;
  analyzer: TestableMultimodalAnalyzer;
  onSave(look: LookDna): boolean;
  onSaved?(look: LookDna): void;
  webInspiration?: WebInspirationReference | null;
  onDeclineWebInspiration?(): void;
}

function imageRef(asset: NonNullable<CaptureQueue["slots"]["inspiration"]["asset"]>): AnalysisImageRef {
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

export function LookDnaPanel({ queue, analyzer, onSave, onSaved, webInspiration, onDeclineWebInspiration }: LookDnaPanelProps) {
  const slot = queue.slots.inspiration;
  const [analysis, setAnalysis] = useState<LookDnaAnalysisV1 | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [webImportError, setWebImportError] = useState<string | null>(null);
  const importedId = useRef<string | null>(null);
  const analyzing = slot.status === "analyzing";

  useEffect(() => {
    if (!webInspiration || importedId.current === webInspiration.id) return;
    importedId.current = webInspiration.id;
    const controller = new AbortController();
    setWebImportError(null);
    void fetchWebInspirationFile(webInspiration, controller.signal)
      .then((file) => queue.process("inspiration", file))
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setWebImportError(cause instanceof Error ? cause.message : "This publisher blocked direct image access.");
      });
    return () => controller.abort();
    // A reference ID represents one deliberate browser-agent handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webInspiration?.id]);

  async function analyze(): Promise<void> {
    if (!slot.asset) return;
    queue.setAnalysisStatus(["inspiration"], "analyzing");
    setAnalysisError(null);
    setSaved(false);
    try {
      const result = await analyzer.analyze({
        contractVersion: MULTIMODAL_CONTRACT_VERSION,
        requestId: `look-dna-${crypto.randomUUID()}`,
        mode: "look-dna",
        images: [imageRef(slot.asset)],
      });
      if (result.mode !== "look-dna") throw new Error("The adapter returned the wrong analysis mode.");
      setAnalysis(result);
      queue.setAnalysisStatus(["inspiration"], "ready");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Inspiration analysis failed.";
      setAnalysisError(message);
      queue.setAnalysisStatus(["inspiration"], "failed", message);
    }
  }

  function saveLook(): void {
    if (!analysis || !slot.asset) return;
    const look: LookDna = {
      id: `look-${crypto.randomUUID()}`,
      sourceAssetId: slot.asset.assetId,
      contractVersion: MULTIMODAL_CONTRACT_VERSION,
      ...analysis.look,
      provenance: "ai-estimated",
      createdAt: new Date().toISOString(),
    };
    if (onSave(look)) {
      setSaved(true);
      onSaved?.(look);
    }
  }

  async function addAnother(): Promise<void> {
    await queue.forget("inspiration");
    setAnalysis(null);
    setAnalysisError(null);
    setSaved(false);
  }

  return (
    <section className="studio-panel" aria-labelledby="look-dna-title">
      <div className="studio-panel-heading">
        <div>
          <h2 id="look-dna-title">Save a look you love.</h2>
          <p>
            Upload a Pinterest image, screenshot or saved TikTok frame. <YangeWordmark /> remembers the
            palette, proportions and styling cues you want to recreate.
          </p>
        </div>
        <div className="adapter-chip">
          <span aria-hidden="true" />
          Outfit-only analysis · no identity
        </div>
      </div>

      {webInspiration && (
        <aside className="web-inspiration-source" aria-live="polite">
          <div>
            <span className="mission-eyebrow">Received from your browser agent</span>
            <strong>{webInspiration.sourceTitle || new URL(webInspiration.sourcePageUrl).hostname}</strong>
            <a href={webInspiration.sourcePageUrl} target="_blank" rel="noreferrer">View original source</a>
          </div>
          <button type="button" className="quiet-action" onClick={onDeclineWebInspiration}>Don’t use this look</button>
        </aside>
      )}
      {webImportError && <div className="error-banner analysis-error" role="alert"><strong>Direct transfer was blocked by the publisher.</strong> {webImportError} Choose or drop the image below to continue the same review safely.</div>}

      <div className="look-workbench">
        <div>
          <ImageDropzone
            kind="inspiration"
            title="Inspiration image"
            description={webInspiration ? "The browser agent sent this public outfit image. Yange rewrites it privately before analysis." : "Use a clear full-outfit image or a saved frame from social media."}
            slot={slot}
            onFile={(file) => void queue.process("inspiration", file)}
            onDemo={() => void queue.useDemo("inspiration")}
            onRetry={() => void queue.retry("inspiration")}
            onRemove={() => {
              void queue.remove("inspiration");
              setAnalysis(null);
              setSaved(false);
            }}
          />
          <div className="analysis-actions look-actions">
            <button
              type="button"
              className="primary-action compact-action"
              disabled={!slot.asset || analyzing}
              onClick={() => void analyze()}
            >
              {analyzing ? "Reading the outfit’s visual grammar…" : analysisError ? "Retry Look DNA analysis" : "Extract Look DNA"}
            </button>
          </div>
          {analysisError && (
            <div className="error-banner analysis-error" role="alert">
              <strong>Analysis paused safely.</strong> {analysisError} Your prepared image is still here.
            </div>
          )}
        </div>

        <div className={`look-result ${analysis ? "has-analysis" : ""}`} aria-live="polite">
          {analysis ? (
            <>
              <div className="look-result-topline">
                <span className="capture-kind">Look DNA · AI estimated</span>
                <strong>{Math.round(analysis.look.confidence * 100)}% extraction confidence</strong>
              </div>
              <h3>{analysis.look.name}</h3>
              <p className="look-silhouette">{analysis.look.silhouette}</p>
              <div className="look-palette" aria-label="Extracted colour palette">
                {analysis.look.palette.map((colour) => (
                  <span key={colour} style={{ backgroundColor: colour }} title={colour} />
                ))}
              </div>
              <div className="look-facts">
                <div><span>Key pieces</span><p>{analysis.look.keyPieces.join(" · ")}</p></div>
                <div><span>Layering logic</span><p>{analysis.look.layering.join(" · ")}</p></div>
                <div><span>Styling cues</span><p>{analysis.look.stylingCues.join(" · ")}</p></div>
                <div><span>Occasion cues</span><p>{analysis.look.occasionCues.join(" · ")}</p></div>
              </div>
              {analysis.warnings.map((warning) => <p className="look-warning" key={warning}><YangeText>{warning}</YangeText></p>)}
              <div className="look-save-actions">
                <button type="button" className="primary-action compact-action" onClick={saveLook} disabled={saved}>
                  {saved ? "Saved to inspiration memory" : "Save this Look DNA"}
                </button>
                {saved && <button type="button" className="quiet-action" onClick={() => void addAnother()}>Add another</button>}
              </div>
            </>
          ) : (
            <div className="look-empty">
              <div aria-hidden="true"><i /><i /><i /></div>
              <span>Look DNA preview</span>
              <h3>Palette. Proportion. Styling logic.</h3>
              <p>Your saved inspiration appears here, ready to shape future outfit ideas.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
