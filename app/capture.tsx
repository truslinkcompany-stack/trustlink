"use client";

import { useEffect, useRef, useState } from "react";

type Geo = { lat: number; lng: number; accuracy: number } | null;
type Step = "intro" | "camera" | "form" | "sending";

const MAX_SIDE = 1920;
const TARGET_BYTES = 3.5 * 1024 * 1024; // запас до лимита запроса Vercel (~4,5 МБ)
const GOOD_ACCURACY_M = 100; // KPI: на улице не хуже 100 м

async function toJpeg(video: HTMLVideoElement): Promise<Blob> {
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
  if (!last) throw new Error("Не удалось подготовить снимок");
  return last;
}

export default function Capture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchRef = useRef<number | null>(null);
  const bestGeo = useRef<Geo>(null);
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [geo, setGeo] = useState<Geo>(null);
  const [geoState, setGeoState] = useState<"wait" | "ok" | "denied">("wait");
  const [project, setProject] = useState("");
  const [author, setAuthor] = useState("");
  const [desc, setDesc] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const stopGeo = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  };
  useEffect(() => () => { stopCamera(); stopGeo(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  /** Следим за положением и держим самый точный из полученных вариантов. */
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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Браузер не поддерживает камеру. Откройте страницу в Safari (iPhone) или Chrome (Android) по ссылке https.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
      startGeo(); // координаты ловим, пока человек наводит камеру
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) { v.srcObject = stream; v.play().catch(() => {}); }
      });
    } catch {
      setError("Нет доступа к камере. Разрешите камеру в настройках браузера и попробуйте снова.");
    }
  }

  async function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setError("Камера ещё не готова. Подождите секунду."); return; }
    try {
      const b = await toJpeg(v);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
      stopCamera();
      stopGeo();
      setStep("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сделать снимок");
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
    // необязательные поля: пустые не отправляем
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
      if (!res.ok) throw new Error(data.error || "Ошибка отправки");
      window.location.href = `/result/${data.id}?t=${data.token}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нет связи с сервером. Проверьте интернет и повторите отправку.");
      setStep("form");
    }
  }

  const lowAccuracy = geo !== null && geo.accuracy > GOOD_ACCURACY_M;
  const geoText =
    geoState === "wait" ? "Определяем координаты…" :
    geoState === "denied" && !geo ? "Координаты не получены: запись будет создана без них. Разрешите геолокацию для сайта в настройках браузера." :
    geo ? `Координаты получены, точность ±${Math.round(geo.accuracy)} м` : "";

  return (
    <div>
      {step === "intro" && (
        <div className="card">
          <p style={{ marginTop: 0 }}>
            Для сертификата сервис сохранит <strong>фото, время, координаты</strong> и то, что вы впишете в необязательные поля. Это нужно, чтобы проверяющий мог убедиться, что снимок настоящий.
          </p>
          <p className="note">Не снимайте людей крупным планом без их согласия: лицо на фото — персональные данные.</p>
          <button className="btn" onClick={openCamera}>Открыть камеру</button>
        </div>
      )}

      {step === "camera" && (
        <div>
          <div className="viewfinder">
            <video ref={videoRef} playsInline muted autoPlay />
          </div>
          <p className="status-line" aria-live="polite">{geoText}</p>
          {lowAccuracy && (
            <p className="note">Точность низкая (±{Math.round(geo!.accuracy)} м). Выйдите на открытое место и подождите несколько секунд: координаты уточняются.</p>
          )}
          <button className="btn" onClick={shoot}>Сделать снимок</button>
        </div>
      )}

      {(step === "form" || step === "sending") && (
        <form onSubmit={send} className="card">
          <div className="viewfinder" style={{ aspectRatio: "4 / 3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Снимок для сертификата" />
          </div>
          <p className="status-line">
            {geo ? `Координаты: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)} (±${Math.round(geo.accuracy)} м)` : "Координаты не получены"}
          </p>
          {lowAccuracy && <p className="note">Точность ±{Math.round(geo!.accuracy)} м хуже {GOOD_ACCURACY_M} м. Лучше переснять на открытом месте.</p>}

          <p className="tag" style={{ marginTop: 14 }}>Поля ниже необязательны. Что не заполнено, в сертификат не попадёт.</p>
          <label htmlFor="project">Проект <span className="tag">(название и организация)</span></label>
          <input id="project" type="text" maxLength={160} value={project} onChange={(e) => setProject(e.target.value)} autoComplete="off" />
          <label htmlFor="author">Имя автора</label>
          <input id="author" type="text" maxLength={80} value={author} onChange={(e) => setAuthor(e.target.value)} autoComplete="off" />
          <label htmlFor="desc">Выполнено <span className="tag">(комментарий)</span></label>
          <textarea id="desc" maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="count">{desc.length}/300</div>
          <p className="tag">Эти поля указаны вами, в сертификате они помечаются как заполненные пользователем.</p>

          {error && <div className="err" role="alert">{error}</div>}
          <button className="btn" type="submit" disabled={step === "sending"}>
            {step === "sending" ? "Отправляем…" : "Отправить и получить сертификат"}
          </button>
          <button className="btn ghost" type="button" onClick={retake} disabled={step === "sending"}>Переснять</button>
        </form>
      )}

      {step !== "form" && step !== "sending" && error && <div className="err" role="alert">{error}</div>}
    </div>
  );
}
