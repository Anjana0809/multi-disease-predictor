// src/TooltipPortal.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * TooltipPortal
 * props:
 *  - anchorRef: React ref to the anchor DOM element
 *  - open: boolean whether to show
 *  - children: content (tooltip body)
 *  - prefer: "right"|"left"|"top"|"bottom" (default right)
 *
 * The portal measures anchorRef.getBoundingClientRect and positions tooltip accordingly.
 */

export default function TooltipPortal({ anchorRef, open, children, prefer = "right", onRequestClose }) {
  const elRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0, placement: prefer });

  // create container for portal once
  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    elRef.current = div;
    return () => {
      try { document.body.removeChild(div); } catch (e) {}
    };
  }, []);

  // recalc position when open or anchor changes
  useEffect(() => {
    if (!open) return;
    const anchor = anchorRef?.current;
    const el = elRef.current;
    if (!anchor || !el) return;

    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // default prefer right
    const tooltipW = 320;
    const tooltipH = 160; // estimated — will auto expand; used for initial placement

    let left = rect.right + 8;
    let top = rect.top;
    let placement = "right";

    if (left + tooltipW > viewportW - 8) {
      // flip to left
      left = rect.left - tooltipW - 8;
      placement = "left";
      if (left < 8) {
        // can't fit left or right - place on top
        left = Math.max(8, rect.left);
        top = rect.top - tooltipH - 8;
        placement = "top";
      }
    }

    // if top clipped, move down a bit
    if (top + tooltipH > viewportH - 12) {
      top = Math.max(12, viewportH - tooltipH - 12);
    }
    if (top < 8) top = 8;

    setPos({ left, top, placement });
  }, [open, anchorRef, prefer]);

  // close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      const el = elRef.current;
      if (!el) return;
      if (!el.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
        onRequestClose && onRequestClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, anchorRef, onRequestClose]);

  if (!elRef.current) return null;
  if (!open) return null;

  const style = { left: pos.left + "px", top: pos.top + "px", position: "absolute" };

  return ReactDOM.createPortal(
    <div className="tooltip-portal" style={style}>
      <div className="tooltip-box">{children}</div>
    </div>,
    elRef.current
  );
}
