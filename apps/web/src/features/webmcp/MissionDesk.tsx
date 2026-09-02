import { useMemo, useState } from "react";
import type { Garment, LookDna, TwinState } from "@yange/domain";
import { RuntimeMultimodalAnalyzer } from "../../aiRuntime";
import { LookDnaPanel } from "../studio/LookDnaPanel";
import { useCaptureQueue, useMediaUrl } from "../studio/useCaptureQueue";
import { CareEvidenceCapture } from "./CareEvidenceCapture";
import type { YangeWebMcpBridge } from "./useYangeWebMcp";

interface MissionDeskProps {
  bridge: YangeWebMcpBridge;
  state: TwinState;
  onSaveLook(look: LookDna): boolean;
  onUpdateGarment(garment: Garment): boolean;
}

function phaseLabel(phase: YangeWebMcpBridge["mission"]["phase"]): string {
  return phase.replaceAll("-", " ");
}

function InspirationMemory({ look }: { look: LookDna }) {
  const source = useMediaUrl(look.sourceAssetId);
  return (
    <article className="inspiration-memory">
      <div className="inspiration-frame">
        {source ? <img src={source} alt="Saved outfit inspiration" /> : <div className="inspiration-palette">{look.palette.map((colour) => <i key={colour} style={{ background: colour }} />)}</div>}
        <span>Untrusted inspiration · interpreted, never obeyed</span>
      </div>
      <div><span className="mission-eyebrow">Look DNA ready</span><h2>{look.name}</h2><p>{look.silhouette}</p><small>{look.keyPieces.join(" · ")}</small></div>
    </article>
  );
}

export function MissionDesk({ bridge, state, onSaveLook, onUpdateGarment }: MissionDeskProps) {
  const { mission, pendingEvidence, pendingInspiration } = bridge;
  const queue = useCaptureQueue();
  const analyzer = useMemo(() => new RuntimeMultimodalAnalyzer(), []);
  const [copied, setCopied] = useState(false);
  const looks = Object.values(state.inspirationLooks).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const activeLook = looks[0] ?? null;
  const unresolved = mission.inspection?.evidenceGaps.find((gap) => !gap.resolved);
  const evidence = pendingEvidence?.gap ?? unresolved ?? null;
  const evidenceGarment = evidence ? state.garments[evidence.garmentId] : null;
  const preparedPath = mission.paths.find((path) => path.id === mission.preparedPlan?.pathId);

  async function copyPrompt() {
    await navigator.clipboard.writeText(bridge.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="mission-desk bring-home" aria-labelledby="mission-title">
      <header className="mission-thesis">
        <div><span className="mission-eyebrow">Yange × WebMCP</span><h1 id="mission-title">Bring this look<br /><em>home.</em></h1><p>Show Yange what inspired you. Your browser agent rebuilds it from clothes you already own, stops where the internet cannot know the truth, and continues only when you confirm.</p></div>
        <div className={`webmcp-state webmcp-${bridge.connection}`} aria-live="polite"><span aria-hidden="true" /><div><small>Browser agent</small><strong>{bridge.connection.replace("-", " ")}</strong></div></div>
      </header>

      <div className="mission-prompt"><div><span>Ask your browser agent</span><p>“{bridge.prompt}”</p></div><button type="button" onClick={() => void copyPrompt()}>{copied ? "Copied" : "Copy prompt"}</button></div>
      {bridge.connection === "unsupported" && <aside className="mission-compatibility" role="note"><strong>You can rehearse the full journey here.</strong><p>In a WebMCP-capable browser, these same visible steps are discovered through semantic tools instead of clicks or DOM scraping.</p></aside>}

      <nav className="mission-journey" aria-label="Bring this look home journey">
        <div className={activeLook ? "done" : "current"}><span>Look I found</span><strong>Inspiration</strong></div><i aria-hidden="true" />
        <div className={mission.inspection ? "done" : activeLook ? "current" : ""}><span>Look I own</span><strong>Wardrobe match</strong></div><i aria-hidden="true" />
        <div className={pendingEvidence ? "current" : evidence?.resolved ? "done" : ""}><span>Fact only I know</span><strong>Physical evidence</strong></div><i aria-hidden="true" />
        <div className={mission.receipt ? "done" : mission.paths.length ? "current" : ""}><span>Plan we share</span><strong>Approved outcome</strong></div>
      </nav>

      <section className="mission-brief" aria-label="Mission brief">
        <label><span>Where I am going</span><input value={mission.constraints.occasion} onChange={(event) => bridge.changeConstraints({ occasion: event.target.value })} /></label>
        <label><span>When</span><input value={mission.constraints.deadline} onChange={(event) => bridge.changeConstraints({ deadline: event.target.value })} /></label>
        <div><span>Use</span><strong>Only clothes I own</strong></div><div><span>Safety</span><strong>Never guess care</strong></div>
      </section>

      {(!activeLook || pendingInspiration) ? <section className="mission-stage" aria-label="Add inspiration"><div className="mission-section-heading"><span>01 · Look I found</span><h2>{pendingInspiration ? "Your browser agent brought the look to Yange." : "Start anywhere on the open web."}</h2><p>{pendingInspiration ? "Review the attributed source, then extract and save its visual structure. The page’s words remain untrusted." : "On a compatible page, say “Bring this look home with Yange.” No screenshot is needed. Manual upload remains available when a publisher blocks direct transfer."}</p></div><LookDnaPanel queue={queue} analyzer={analyzer} onSave={onSaveLook} onSaved={bridge.completeInspiration} webInspiration={pendingInspiration} onDeclineWebInspiration={() => bridge.declineInspiration()} /></section> : <section className="mission-stage" aria-label="Saved inspiration"><InspirationMemory look={activeLook} />{!mission.inspection && <button type="button" className="primary-action mission-forward" onClick={bridge.inspect}>Find this look in my wardrobe</button>}</section>}

      {mission.inspection && <section className="mission-stage wardrobe-reconstruction" aria-labelledby="reconstruction-title">
        <div className="mission-section-heading"><span>02 · Look I own</span><h2 id="reconstruction-title">Yange translates inspiration into owned pieces.</h2><p>The agent receives names, state and evidence quality. Private photo bytes and the raw event ledger stay outside WebMCP.</p></div>
        <div className="reconstruction-grid">{mission.inspection.candidateGarments.map((item) => { const garment = state.garments[item.id]; return <article key={item.id}><i style={{ background: garment?.colour ?? "#53665c" }} /><span>{item.category}</span><h3>{item.name}</h3><p>{item.state.replaceAll("-", " ")}</p><small>Care: {item.careEvidence.replaceAll("-", " ")}</small></article>; })}</div>
        {mission.phase === "inspected" && !pendingEvidence && <button type="button" className="primary-action mission-forward" onClick={bridge.requestEvidence}>Ask me for the one missing fact</button>}
      </section>}

      {evidence && (pendingEvidence || mission.phase === "waiting-for-human") && <section className="human-evidence-card physical-relay" aria-live="assertive">
        <div className="mission-section-heading"><span>03 · Fact only I know</span><h2>The internet ends here.<br />Your wardrobe begins.</h2><p>{evidence.whyItMatters}</p></div>
        {evidence.fact === "care-wash-method" && evidenceGarment ? <CareEvidenceCapture garment={evidenceGarment} queue={queue} analyzer={analyzer} onConfirm={(garment, washMethod) => { if (!onUpdateGarment(garment)) return false; bridge.answerEvidence(washMethod); return true; }} onDecline={() => bridge.answerEvidence(null)} /> : <div className="physical-confirmation"><span className="mission-eyebrow">Look at the garment, not the screen</span><h3>Is {evidence.garmentName} physically available?</h3><div>{evidence.acceptedResponses.map((response) => <button type="button" className={response === "available" ? "primary-action" : ""} key={response} onClick={() => bridge.answerEvidence(response)}>{response.replaceAll("-", " ")}</button>)}<button type="button" onClick={() => bridge.answerEvidence(null)}>I cannot confirm</button></div></div>}
      </section>}

      {mission.phase === "ready-to-simulate" && <section className="mission-resume"><span>Evidence received</span><h2>The same agent call can now continue from something real.</h2><button type="button" className="primary-action" onClick={bridge.simulate}>Compare safe ways to wear it</button></section>}

      {mission.paths.length > 0 && <section className="mission-paths" aria-labelledby="paths-title"><div className="mission-section-heading"><span>04 · Plan we share</span><h2 id="paths-title">Three futures, compared before anything changes.</h2></div><div className="path-grid">{mission.paths.map((path) => <article className={`mission-path path-${path.status} ${preparedPath?.id === path.id ? "path-selected" : ""}`} key={path.id}><div><span>{path.family.replaceAll("-", " ")}</span><em>{path.status}</em></div><h3>{path.title}</h3><p>{path.summary}</p><small>{path.garmentIds.length} owned pieces · {path.reversible ? "reversible" : "committing"}</small>{path.reasonCodes.map((code) => <code key={code}>{code}</code>)}{mission.phase === "simulated" && path.status === "feasible" && <button type="button" onClick={() => bridge.prepare(path.id)}>Prepare this path</button>}</article>)}</div></section>}

      {mission.preparedPlan && !mission.receipt && <section className="mission-approval"><div><span className="mission-eyebrow">Prepared, not committed</span><h2>{preparedPath?.title}</h2><p>Your approval is bound to this exact plan and current wardrobe revision.</p></div><ul>{mission.preparedPlan.intendedMutations.map((effect) => <li key={effect}>{effect}</li>)}</ul>{mission.phase === "prepared" ? <button type="button" className="primary-action" onClick={bridge.approve}>Approve this exact plan</button> : <div className="approved-plan"><strong>Approved by you</strong><span>The agent may commit once.</span><button type="button" className="primary-action" onClick={bridge.commit}>Commit approved plan</button></div>}</section>}

      {mission.receipt && <section className="mission-receipt" aria-labelledby="receipt-title"><span className="mission-eyebrow">Shared receipt</span><h2 id="receipt-title">The inspiration became an owned, verified plan.</h2><div className="receipt-grid"><div><span>Plan</span><strong>{mission.receipt.approvedPath.replaceAll("-", " ")}</strong></div><div><span>Operation</span><code>{mission.receipt.operationId}</code></div><div><span>Evidence</span><strong>{mission.receipt.evidenceUsed.length} cited facts</strong></div><div><span>Replay</span><strong>Safe by receipt ID</strong></div></div><ul>{mission.receipt.committedActions.map((action) => <li key={action}>{action}</li>)}</ul></section>}

      <details className="mission-proof-drawer"><summary>Technical proof · semantic tools and visible receipts</summary><div className="registered-tools"><span>{bridge.registeredTools.length} tools available in {phaseLabel(mission.phase)}</span>{bridge.registeredTools.map((tool) => <code key={tool}>{tool}</code>)}</div><ol>{mission.timeline.map((entry) => <li key={entry.id}><span>{entry.actor}</span><div><strong>{entry.intent}</strong><p>{entry.detail}</p></div><time>{new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ol></details>
      <footer className="mission-demo-controls"><span>Mission controls</span><div>{(["opened", "stale", "blocked"].includes(mission.phase) && activeLook) && <button type="button" onClick={bridge.inspect}>Re-check wardrobe</button>}<button type="button" onClick={bridge.resetMission}>Start a new mission</button></div></footer>
    </section>
  );
}
