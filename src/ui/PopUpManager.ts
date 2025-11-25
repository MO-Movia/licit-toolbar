/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {clamp} from './clamp';
import {fromHTMlElement, fromXY, isIntersected} from './rects';
import type {PositionHandler} from './PopUpPosition';
import type {Rect} from './rects';

export type PopUpDetails = {
  anchor?: HTMLElement;
  anchorRect?: Rect;
  autoDismiss: boolean;
  body?: HTMLElement;
  bodyRect?: Rect;
  close: (val?: unknown) => void;
  modal: boolean;
  position: PositionHandler;
  popupId: string;
};

export type PopUpBridge = {
  getDetails: () => PopUpDetails;
};

const CLICK_INTERVAL = 350;
const DUMMY_RECT = {x: -10000, y: -10000, w: 0, h: 0};

export class PopUpManager {
  _bridges = new Map<PopUpBridge, number>();
  _positions = new Map<PopUpBridge, string | null>();
  isColorPicker = false;

  _mx = 0;
  _my = 0;
  _rafID = 0;

  register(bridge: PopUpBridge): void {
    this._bridges.set(bridge, Date.now());
    this._positions.set(bridge, null);
    if (this._bridges.size === 1) {
      this._observe();
    }
    this._rafID = requestAnimationFrame(this._syncPosition);
  }

  unregister(bridge: PopUpBridge): void {
    this._bridges.delete(bridge);
    this._positions.delete(bridge);
    this.isColorPicker = false;
    if (this._bridges.size === 0) {
      this._unobserve();
    }
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
    }
  }

  _observe(): void {
    this._unobserve();
    document.addEventListener('mousemove', this._onMouseChange, false);
    document.addEventListener('mouseup', this._onMouseChange, false);
    document.addEventListener('click', this._onClick, false);
    window.addEventListener('scroll', this._onScroll, true);
    window.addEventListener('resize', this._onResize, true);
  }

  _unobserve(): void {
    document.removeEventListener('mousemove', this._onMouseChange, false);
    document.removeEventListener('mouseup', this._onMouseChange, false);
    document.removeEventListener('click', this._onClick, false);
    window.removeEventListener('scroll', this._onScroll, true);
    window.removeEventListener('resize', this._onResize, true);
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
    }
  }

  _onScroll = (_e: Event): void => {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
    }
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onResize = (_e: Event): void => {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
    }
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onMouseChange = (e: MouseEvent): void => {
    this._mx = Math.round(e.clientX);
    this._my = Math.round(e.clientY);
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
    }
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onClick = (e: MouseEvent): void => {
    const now = Date.now();
    this.isColorPicker = false;

    const detailsWithModalToDismiss = this.findModalToDismiss(now, e);

    if (!detailsWithModalToDismiss) {
      return;
    }

    this.handleModalDismissal(detailsWithModalToDismiss, e);
  };

  private findModalToDismiss(now: number, e: MouseEvent): PopUpDetails | null {
    for (const [bridge, registeredAt] of this._bridges) {
      if (now - registeredAt <= CLICK_INTERVAL) {
        continue;
      }

      const details: PopUpDetails = bridge.getDetails();

      if (this.isColorPickerTarget(e, details)) {
        this.isColorPicker = true;
        return null;
      }

      if (details.modal && details.autoDismiss) {
        return details;
      }
    }
    return null;
  }

  private isColorPickerTarget(e: MouseEvent, details: PopUpDetails): boolean {
    if (!details.autoDismiss || !details.popupId) {
      return false;
    }
    const targetName = (e.target as HTMLElement).className;
    return targetName?.startsWith('mocp') ?? false;
  }

  private handleModalDismissal(
    detailsWithModalToDismiss: PopUpDetails,
    e: MouseEvent
  ): void {
    const {body, close} = detailsWithModalToDismiss;
    const pointer = fromXY(e.clientX, e.clientY, 1);
    const bodyRect = body ? fromHTMlElement(body) : null;

    if (!bodyRect || !isIntersected(pointer, bodyRect)) {
      this.isColorPicker = false;
      close();
    }
  }

  _syncPosition = (): void => {
    this._rafID = 0;

    const bridgeToDetails = this.buildBridgeDetailsMap();
    const pointer = fromXY(this._mx, this._my, 2);
    const hoveredAnchors = this.updatePositionsAndGetHoveredAnchors(
      bridgeToDetails,
      pointer
    );

    this.expandHoveredAnchors(bridgeToDetails, hoveredAnchors);
    this.dismissNonHoveredPopups(bridgeToDetails, hoveredAnchors);
  };

  private buildBridgeDetailsMap(): Map<PopUpBridge, PopUpDetails> {
    const bridgeToDetails = new Map<PopUpBridge, PopUpDetails>();
    for (const [bridge] of this._bridges) {
      const details: PopUpDetails = bridge.getDetails();
      bridgeToDetails.set(bridge, details);

      const {anchor, body} = details;
      if (body instanceof HTMLElement) {
        details.bodyRect = fromHTMlElement(body);
      }
      if (anchor instanceof HTMLElement) {
        details.anchorRect = fromHTMlElement(anchor);
      }
    }
    return bridgeToDetails;
  }

  private updatePositionsAndGetHoveredAnchors(
    bridgeToDetails: Map<PopUpBridge, PopUpDetails>,
    pointer: Rect
  ): Set<HTMLElement> {
    const hoveredAnchors = new Set<HTMLElement>();

    for (const [bridge, details] of bridgeToDetails) {
      const {anchor, bodyRect, anchorRect, position} = details;

      if (!bodyRect && !anchorRect) {
        continue;
      }

      this.updateBodyPosition(bridge, details, bodyRect, anchorRect, position);

      if (
        isIntersected(pointer, bodyRect || DUMMY_RECT, 0) ||
        isIntersected(pointer, anchorRect || DUMMY_RECT, 0)
      ) {
        if (anchor) {
          hoveredAnchors.add(anchor);
        }
      }
    }

    return hoveredAnchors;
  }

  private updateBodyPosition(
    bridge: PopUpBridge,
    details: PopUpDetails,
    bodyRect: Rect,
    anchorRect: Rect,
    position: PositionHandler
  ): void {
    const {x, y} = position(anchorRect, bodyRect);
    const positionKey = `${x}-${y}`;
    const {body} = details;

    if (body && bodyRect && this._positions.get(bridge) !== positionKey) {
      const ax = anchorRect
        ? clamp(
            0,
            anchorRect.x - x + anchorRect.w / 2,
            bodyRect.w - anchorRect.w / 2
          )
        : 0;

      this._positions.set(bridge, positionKey);
      const bodyStyle = body.style;
      bodyStyle.position = 'absolute';
      bodyStyle.left = `${x}px`;
      bodyStyle.top = `${y}px`;
      bodyRect.x = x;
      bodyRect.y = y;
      bodyStyle.setProperty('--czi-pop-up-anchor-offset-left', `${ax}px`);
    }
  }

  private expandHoveredAnchors(
    bridgeToDetails: Map<PopUpBridge, PopUpDetails>,
    hoveredAnchors: Set<HTMLElement>
  ): void {
    let size;

    do {
      size = hoveredAnchors.size;

      for (const [, details] of bridgeToDetails) {
        const {anchor, body} = details;

        for (const ha of hoveredAnchors) {
          if (
            anchor &&
            body &&
            !hoveredAnchors.has(anchor) &&
            body.contains(ha)
          ) {
            hoveredAnchors.add(anchor);
          }
        }
      }
    } while (hoveredAnchors.size !== size);
  }

  private dismissNonHoveredPopups(
    bridgeToDetails: Map<PopUpBridge, PopUpDetails>,
    hoveredAnchors: Set<HTMLElement>
  ): void {
    const now = Date.now();

    for (const [bridge, registeredAt] of this._bridges) {
      const details = bridgeToDetails.get(bridge);
      if (!details) {
        continue;
      }

      if (this.shouldDismissPopup(details, registeredAt, now, hoveredAnchors)) {
        details.close();
      }
    }
  }

  private shouldDismissPopup(
    details: PopUpDetails,
    registeredAt: number,
    now: number,
    hoveredAnchors: Set<HTMLElement>
  ): boolean {
    const {autoDismiss, anchor, modal} = details;

    return (
      autoDismiss &&
      !modal &&
      now - registeredAt > CLICK_INTERVAL &&
      !hoveredAnchors.has(anchor) &&
      !this.isColorPicker
    );
  }
}

const instance = new PopUpManager();

export default instance;
