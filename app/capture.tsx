"use client";

import { useEffect, useRef, useState } from "react";
import { fmt, dict } from "@/lib/dict";

type T = typeof dict.ru.capture;
type Geo = { lat: number; lng: number; accuracy: number } | null;
type Step = "intro" | "camera" | "form" | "sending";

const MAX_SIDE = 1920;
const TARGET_BYTES = 3.5 * 1024 * 1024; // запас до лимита запроса Vercel (~4,5 МБ)
const GOOD_ACCURACY_M = 100; // KPI: на улице не хуже 100 м

async function toJpeg(video: HTMLVideoElement, failMsg: string): Promise<Blob> {
  const w = video.videoWidth, h = video.videoHeight;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
  for (let q = 0.85; q >= 0.4; q -= 0.15) {
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= TARGET_BYTES) return blob;
  }
  const last: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.35));
  if (!last) throw new Error(failMsg);
  return last;
}

export default function Capture({ t }: { t: T }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchRef = useRef<number | null>(null);
  const bestGeo = useRef<Geo>(null);
  const [step, setStep] = useState<Step>("intro");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [geo, setGeo] = useState<Geo>(null);
  const [geoState, setGeoState] = useState<"wait" | "ok" | "denied">("wait");
  const [project, setProject] = useState("");
  const [author, setAuthor] = useState("");
  const [desc, setDesc] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  const stopGeo = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  };
  useEffect(() => () => { stopCamera(); stopGeo(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Подключаем поток к <video> ПОСЛЕ того, как элемент появился на странице
  useEffect(() => {
    if (step !== "camera") return;
    const v = videoRef.current, s = streamRef.current;
    if (!v || !s) return;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.srcObject = s;
    v.play().catch(() => {});
  }, [step]);

  function startGeo() {
    stopGeo();
    bestGeo.current = null;
    setGeo(null);
    setGeoState("wait");
    if (!("geolocation" in navigator)) { setGeoState("denied"); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const g = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        if (!bestGeo.current || g.accuracy <= bestGeo.current.accuracy) {
          bestGeo.current = g;
          setGeo(g);
        }
        setGeoState("ok");
      },
      () => { if (!bestGeo.current) setGeoState("denied"); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function openCamera() {
    setError("");
    setReady(false);
    if (!navigator.mediaDevices?.getUserMedia) { setError(t.errNoApi); return; }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // запасной вариант
      }
      streamRef.current = stream;
      setStep("camera");
      startGeo();
    } catch {
      setError(t.errNoAccess);
    }
  }

  async function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setError(t.notReady); return; }
    try {
      const b = await toJpeg(v, t.prepFail);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
      stopCamera();
      stopGeo();
      setError("");
      setStep("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.prepFail);
    }
  }

  function retake() {
    setBlob(null);
    setPreview("");
    openCamera();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!blob) return;
    setError("");
    setStep("sending");
    const fd = new FormData();
    fd.append("photo", blob, "photo.jpg");
    if (project.trim()) fd.append("project_name", project.trim());
    if (author.trim()) fd.append("author_name", author.trim());
    if (desc.trim()) fd.append("description", desc.trim());
    fd.append("client_time", new Date().toISOString());
    fd.append("client_tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    if (geo) {
      fd.append("lat", String(geo.lat));
      fd.append("lng", String(geo.lng));
      fd.append("accuracy", String(geo.accuracy));
    }
    try {
      const res = await fetch("/api/records", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.sendErr);
      window.location.href = `/result/${data.id}?t=${data.token}`;
    } catch (err) {
      setError(err instanceof TypeError ? t.netErr : err instanceof Error ? err.message : t.netErr);
      setStep("form");
    }
  }

  const low = geo !== null && geo.accuracy > GOOD_ACCURACY_M;
  const dot = geoState === "denied" && !geo ? "bad" : geo ? (low ? "low" : "ok") : "";
  const geoText =
    geoState === "wait" && !geo ? t.geoWait :
    geoState === "denied" && !geo ? t.geoDenied :
    geo ? fmt(t.geoOk, { n: Math.round(geo.accuracy) }) : "";

  return (
    <div>
      {step === "intro" && (
        <div>
          <p style={{ marginTop: 0 }}>{t.intro}</p>
          <p className="note">{t.consent}</p>
          <button className="btn" onClick={openCamera}>{t.open}</button>
        </div>
      )}

      {step === "camera" && (
        <div>
          <div className="viewfinder">
            <video ref={videoRef} playsInline muted autoPlay onLoadedMetadata={() => setReady(true)} onPlaying={() => setReady(true)} />
            <div className="reticle" />
            {!ready && <div className="vf-msg">{t.starting}</div>}
          </div>
          <div className="gps" aria-live="polite"><span className={`dot ${dot}`} />{geoText}</div>
          {low && <p className="note">{fmt(t.lowCam, { n: Math.round(geo!.accuracy) })}</p>}
          <div className="shutter-row">
            <button className="shutter" onClick={shoot} disabled={!ready} aria-label={t.shutter} title={t.shutter} />
          </div>
        </div>
      )}

      {(step === "form" || step === "sending") && (
        <form onSubmit={send}>
          <div className="viewfinder" style={{ aspectRatio: "4 / 3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={t.previewAlt} />
          </div>
          <div className="gps">
            <span className={`dot ${dot}`} />
            {geo ? fmt(t.coords, { lat: geo.lat.toFixed(4), lng: geo.lng.toFixed(4), n: Math.round(geo.accuracy) }) : t.coordsNone}
          </div>
          {low && <p className="note">{fmt(t.lowForm, { n: Math.round(geo!.accuracy), m: GOOD_ACCURACY_M })}</p>}

          <p className="tag" style={{ marginTop: 14 }}>{t.optHint}</p>
          <label htmlFor="project">{t.fProject} <span className="tag">{t.fProjectHint}</span></label>
          <input id="project" type="text" maxLength={160} value={project} onChange={(e) => setProject(e.target.value)} autoComplete="off" />
          <label htmlFor="author">{t.fAuthor}</label>
          <input id="author" type="text" maxLength={80} value={author} onChange={(e) => setAuthor(e.target.value)} autoComplete="off" />
          <label htmlFor="desc">{t.fDone} <span className="tag">{t.fDoneHint}</span></label>
          <textarea id="desc" maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="count">{desc.length}/300</div>
          <p className="tag">{t.userFilled}</p>

          {error && <div className="err" role="alert">{error}</div>}
          <button className="btn" type="submit" disabled={step === "sending"}>{step === "sending" ? t.sending : t.submit}</button>
          <button className="btn ghost" type="button" onClick={retake} disabled={step === "sending"}>{t.retake}</button>
        </form>
      )}

      {step !== "form" && step !== "sending" && error && <div className="err" role="alert">{error}</div>}
    </div>
  );
}