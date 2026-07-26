import { useEffect, useRef, useState } from 'react';

type Props = {
  imageUrl: string;
  cardNumber: number;
  onClose: () => void;
};

type Point = { x: number; y: number };

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.25;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function ScorecardViewer({
  imageUrl,
  cardNumber,
  onClose
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  function fitToWindow() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function showActualSize() {
    const image = imageRef.current;
    if (!image || image.clientWidth === 0 || image.clientHeight === 0) return;

    const displayedDimension = rotation % 180 === 0
      ? Math.max(image.clientWidth, image.clientHeight)
      : Math.max(image.clientHeight, image.clientWidth);
    const naturalDimension = rotation % 180 === 0
      ? Math.max(image.naturalWidth, image.naturalHeight)
      : Math.max(image.naturalHeight, image.naturalWidth);

    setZoom(clamp(naturalDimension / displayedDimension, MIN_ZOOM, MAX_ZOOM));
    setPan({ x: 0, y: 0 });
  }

  function changeZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  }

  function rotateBy(degrees: number) {
    setRotation((current) => (current + degrees + 360) % 360);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === '+' || event.key === '=') changeZoom(zoom + ZOOM_STEP);
      if (event.key === '-') changeZoom(zoom - ZOOM_STEP);
      if (event.key.toLowerCase() === 'r') rotateBy(event.shiftKey ? -90 : 90);
      if (event.key === '0') fitToWindow();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, zoom]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = pan;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    setPan({
      x: panStartRef.current.x + event.clientX - dragStart.x,
      y: panStartRef.current.y + event.clientY - dragStart.y
    });
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragStartRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }

  return (
    <div
      className="scorecard-viewer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Scorecard viewer for Card ${cardNumber}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="scorecard-viewer-shell">
        <header className="scorecard-viewer-header">
          <div>
            <strong>Card {cardNumber}</strong>
            <span>Paper Scorecard</span>
          </div>
          <button
            type="button"
            className="scorecard-viewer-close"
            onClick={onClose}
            aria-label="Close scorecard viewer"
          >
            ×
          </button>
        </header>

        <div
          ref={viewportRef}
          className={`scorecard-viewer-viewport${dragging ? ' dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onWheel={handleWheel}
          onDoubleClick={fitToWindow}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={`Paper scorecard for Card ${cardNumber}`}
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`
            }}
          />
        </div>

        <footer className="scorecard-viewer-toolbar">
          <div className="scorecard-viewer-tool-group" aria-label="Zoom controls">
            <button type="button" onClick={() => changeZoom(zoom - ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(zoom + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>+</button>
          </div>

          <div className="scorecard-viewer-tool-group">
            <button type="button" onClick={() => rotateBy(-90)}>Rotate Left</button>
            <button type="button" onClick={() => rotateBy(90)}>Rotate Right</button>
          </div>

          <div className="scorecard-viewer-tool-group">
            <button type="button" onClick={fitToWindow}>Fit</button>
            <button type="button" onClick={showActualSize}>Actual Size</button>
          </div>
        </footer>

        <div className="scorecard-viewer-help">
          Drag to pan · Mouse wheel or +/− to zoom · Double-click to fit · Esc to close
        </div>
      </section>
    </div>
  );
}
