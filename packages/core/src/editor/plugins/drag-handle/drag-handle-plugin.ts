import { SelectionRange, Selection, PluginKey, Plugin } from '@tiptap/pm/state';
import { NodeRange } from '@tiptap/pm/model';
import { ResolvedPos, Node as TNode } from '@tiptap/pm/model';
import type { Mappable } from '@tiptap/pm/transform';
import { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import {
  autoUpdate,
  computePosition,
  offset,
  type Placement,
  type VirtualElement,
} from '@floating-ui/dom';

function getSelectionRanges(
  state: ResolvedPos,
  range: ResolvedPos,
  depth?: number
): SelectionRange[] {
  const ranges: SelectionRange[] = [];
  const root = state.node(0);
  depth =
    typeof depth === 'number' && depth >= 0
      ? depth
      : state.sameParent(range)
        ? Math.max(0, state.sharedDepth(range.pos) - 1)
        : state.sharedDepth(range.pos);
  const nodeRange = new NodeRange(state, range, depth);
  const startIndex =
    nodeRange.depth === 0 ? 0 : root.resolve(nodeRange.start).posAtIndex(0);
  nodeRange.parent.forEach((size, offset) => {
    const from = startIndex + offset;
    const to = from + size.nodeSize;
    if (from < nodeRange.start || from >= nodeRange.end) return;
    const selectionRange = new SelectionRange(
      root.resolve(from),
      root.resolve(to)
    );
    ranges.push(selectionRange);
  });
  return ranges;
}

class NodeRangeBookmark {
  anchor: number;
  head: number;
  constructor(anchor: number, head: number) {
    this.anchor = anchor;
    this.head = head;
  }
  map(mapping: Mappable) {
    return new NodeRangeBookmark(
      mapping.map(this.anchor),
      mapping.map(this.head)
    );
  }
  resolve(doc: TNode) {
    const e = doc.resolve(this.anchor);
    const o = doc.resolve(this.head);
    return new NodeRangeSelection(e, o);
  }
}

class NodeRangeSelection extends Selection {
  depth: number | undefined;

  constructor(t: ResolvedPos, e: ResolvedPos, o?: number, s: number = 1) {
    const { doc: r } = t;
    const n = t === e;
    const i = t.pos === r.content.size && e.pos === r.content.size;
    const a = n && !i ? r.resolve(e.pos + (s > 0 ? 1 : -1)) : e;
    const c = n && i ? r.resolve(t.pos - (s > 0 ? 1 : -1)) : t;
    const d = getSelectionRanges(c.min(a), c.max(a), o);
    super(
      a.pos >= t.pos ? d[0].$from : d[d.length - 1].$to,
      a.pos >= t.pos ? d[d.length - 1].$to : d[0].$from,
      d
    );
    this.depth = o;
  }
  get $to() {
    return this.ranges[this.ranges.length - 1].$to;
  }
  eq(other: Selection): boolean {
    return (
      other instanceof NodeRangeSelection &&
      other.$from.pos === this.$from.pos &&
      other.$to.pos === this.$to.pos
    );
  }
  map(doc: TNode, mapping: Mappable) {
    const o = doc.resolve(mapping.map(this.anchor));
    const s = doc.resolve(mapping.map(this.head));
    return new NodeRangeSelection(o, s);
  }
  toJSON() {
    return { type: 'nodeRange', anchor: this.anchor, head: this.head };
  }
  get isForwards() {
    return this.head >= this.anchor;
  }
  get isBackwards() {
    return !this.isForwards;
  }
  extendBackwards() {
    const { doc: t } = this.$from;
    if (this.isForwards && this.ranges.length > 1) {
      const t = this.ranges.slice(0, -1);
      const e = t[0].$from;
      const o = t[t.length - 1].$to;
      return new NodeRangeSelection(e, o, this.depth);
    }
    const e = this.ranges[0];
    const o = t.resolve(Math.max(0, e.$from.pos - 1));
    return new NodeRangeSelection(this.$anchor, o, this.depth);
  }
  extendForwards() {
    const { doc: t } = this.$from;
    if (this.isBackwards && this.ranges.length > 1) {
      const t = this.ranges.slice(1);
      const e = t[0].$from;
      const o = t[t.length - 1].$to;
      return new NodeRangeSelection(o, e, this.depth);
    }
    const e = this.ranges[this.ranges.length - 1];
    const o = t.resolve(Math.min(t.content.size, e.$to.pos + 1));
    return new NodeRangeSelection(this.$anchor, o, this.depth);
  }
  static fromJSON(doc: TNode, json: { anchor: number; head: number }) {
    return new NodeRangeSelection(
      doc.resolve(json.anchor),
      doc.resolve(json.head)
    );
  }
  static create(
    doc: TNode,
    anchor: number,
    head: number,
    depth?: number,
    bias: number = 1
  ) {
    return new this(doc.resolve(anchor), doc.resolve(head), depth, bias);
  }
  getBookmark(): NodeRangeBookmark {
    return new NodeRangeBookmark(this.anchor, this.head);
  }
}

function cloneElement(node: HTMLElement) {
  const clonedNode = node.cloneNode(true) as HTMLElement;
  const originalElements = [
    node,
    ...Array.from(node.getElementsByTagName('*')),
  ];
  const clonedElements = [
    clonedNode,
    ...Array.from(clonedNode.getElementsByTagName('*')),
  ];

  originalElements.forEach((element, index) => {
    const clonedElement = clonedElements[index];

    if (
      clonedElement instanceof HTMLElement &&
      element instanceof HTMLElement
    ) {
      clonedElement.style.cssText = (function (element: HTMLElement) {
        let styles = '';
        const computedStyles = getComputedStyle(element);
        for (let i = 0; i < computedStyles.length; i += 1) {
          styles += `${computedStyles[i]}:${computedStyles.getPropertyValue(computedStyles[i])};`;
        }
        return styles;
      })(element);
    }
  });

  return clonedNode;
}

function getComputedStyles(
  node: Element,
  property: 'paddingLeft' | 'paddingRight' | 'borderLeftWidth'
) {
  return window.getComputedStyle(node)[property];
}
function minMax(value = 0, min = 0, max = 0) {
  return Math.min(Math.max(value, min), max);
}
function removeNode(node: HTMLElement) {
  if (node.parentNode !== null && node.parentNode !== undefined) {
    node.parentNode.removeChild(node);
  }
}

export type FindElementNextToCoords = {
  x: number;
  y: number;
  direction?: 'left' | 'right';
  editor: Editor;
};

const findElementNextToCoords = (options: FindElementNextToCoords) => {
  const { x, y, direction, editor } = options;
  let resultElement = null;
  let resultNode = null;
  let d = null;
  let l = x;
  for (; null === resultNode && l < window.innerWidth && l > 0;) {
    const elements = document.elementsFromPoint(l, y);
    const index = elements.findIndex((el) =>
      el.classList.contains('ProseMirror')
    );
    const filteredElements = elements.slice(0, index);
    if (filteredElements.length > 0) {
      const element = filteredElements[0];
      resultElement = element;
      d = editor.view.posAtDOM(element, 0);
      if (d >= 0) {
        resultNode = editor.state.doc.nodeAt(Math.max(d - 1, 0));
        if (resultNode === null || resultNode.isText) {
          resultNode = editor.state.doc.nodeAt(Math.max(d - 1, 0));
        }
        if (!resultNode) {
          resultNode = editor.state.doc.nodeAt(Math.max(d, 0));
        }
        break;
      }
    }
    if (direction === 'left') {
      l -= 1;
    } else {
      l += 1;
    }
  }
  return { resultElement, resultNode, pos: d !== null ? d : null };
};

function getSelectionRangesNearCursor(e: MouseEvent, t: Editor) {
  const { doc: n } = t.view.state,
    o = findElementNextToCoords({
      editor: t,
      x: e.clientX,
      y: e.clientY,
      direction: 'right',
    });
  if (!o.resultNode || null === o.pos) return [];
  const r = e.clientX,
    i = (function (e, t, n) {
      const o = parseInt(getComputedStyles(e.dom, 'paddingLeft'), 10),
        r = parseInt(getComputedStyles(e.dom, 'paddingRight'), 10),
        i = parseInt(getComputedStyles(e.dom, 'borderLeftWidth'), 10),
        s = parseInt(getComputedStyles(e.dom, 'borderLeftWidth'), 10),
        d = e.dom.getBoundingClientRect();
      return { left: minMax(t, d.left + o + i, d.right - r - s), top: n };
    })(t.view, r, e.clientY),
    s = t.view.posAtCoords(i);
  if (!s) return [];
  const { pos: d } = s;
  if (!n.resolve(d).parent) return [];
  const a = n.resolve(o.pos),
    p = n.resolve(o.pos + 1);
  return getSelectionRanges(a, p, 0);
}
const getPreviousNodeStartPosition = (doc: TNode, pos: number) => {
  const resolved = doc.resolve(pos);
  if (resolved.depth === 0) return pos;
  return resolved.pos - resolved.parentOffset - 1;
};

const getAncestorNodeAtDepth = (doc: TNode, pos: number) => {
  const resolved = doc.resolve(pos);
  let depth = resolved.depth;
  let ancestor = doc.nodeAt(pos);
  while (depth > 0) {
    const node = resolved.node(depth);
    depth -= 1;
    if (depth === 0) ancestor = node;
  }
  return ancestor;
};

/** The direct child of the editor root that contains `node`. */
const getOuterNodePos = (view: EditorView, node: Node | null) => {
  let outer = node;
  while (outer?.parentNode && outer.parentNode !== view.dom)
    outer = outer.parentNode;
  return outer;
};

export type DragHandleFloatingOptions = {
  placement?: Placement;
  offset?: number;
  zIndex?: number;
};

type DragHandlePluginOptions = DragHandleFloatingOptions & {
  pluginKey?: PluginKey | string;
  element: HTMLElement;
  editor: Editor;
  onNodeChange?: (data: {
    editor: Editor;
    node: TNode | null;
    pos: number;
  }) => void;
};

export const dragHandlePluginDefaultKey = new PluginKey('dragHandle');
export function DragHandlePlugin(
  options: DragHandlePluginOptions
): Plugin<{ locked: boolean }> {
  const {
    pluginKey = dragHandlePluginDefaultKey,
    element,
    editor,
    placement = 'left-start',
    offset: offsetDistance = 0,
    zIndex = 10,
    onNodeChange,
  } = options;

  const container = document.createElement('div');
  // Floating UI positions this wrapper next to the hovered block.
  const floating = document.createElement('div');
  Object.assign(floating.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: String(zIndex),
    visibility: 'hidden',
    opacity: '0',
  });
  let viewActive = false;
  let locked = false;
  let currentNode: TNode | null = null;
  let lastNodePos = -1;
  let shownReference: Element | null = null;
  let stopAutoUpdate: (() => void) | null = null;

  const reducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showFloating(reference: Element) {
    if (shownReference === reference && stopAutoUpdate) return;
    stopAutoUpdate?.();
    shownReference = reference;
    const anchor: VirtualElement = {
      getBoundingClientRect: () => reference.getBoundingClientRect(),
      contextElement: reference,
    };
    floating.style.transition = reducedMotion()
      ? ''
      : 'opacity 100ms, visibility 100ms';
    const update = () =>
      computePosition(anchor, floating, {
        placement,
        strategy: 'absolute',
        middleware: [offset(offsetDistance)],
      }).then(({ x, y }) => {
        if (shownReference !== reference) return;
        Object.assign(floating.style, {
          left: `${x}px`,
          top: `${y}px`,
          visibility: 'visible',
          opacity: '1',
        });
      });
    stopAutoUpdate = autoUpdate(anchor, floating, update);
  }
  function hideFloating() {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    shownReference = null;
    floating.style.visibility = 'hidden';
    floating.style.opacity = '0';
  }
  function setCurrentNode(node: TNode | null, pos: number) {
    currentNode = node;
    lastNodePos = pos;
    onNodeChange?.({ editor, node, pos });
  }
  function hideDragHandle() {
    hideFloating();
    if (currentNode || lastNodePos !== -1) setCurrentNode(null, -1);
  }
  /** Shows the handle for the top-level block rendered by `dom`. */
  function trackBlock(view: EditorView, dom: Node | null) {
    const outer = getOuterNodePos(view, dom);
    if (!outer || outer === view.dom || outer.nodeType !== 1) return;
    const pos = view.posAtDOM(outer, 0);
    const node = getAncestorNodeAtDepth(editor.state.doc, pos);
    if (node === currentNode) return;
    setCurrentNode(node, getPreviousNodeStartPosition(editor.state.doc, pos));
    showFloating(outer as Element);
  }

  let dragImage: HTMLElement | null = null;
  let dragTimer: ReturnType<typeof setTimeout> | null = null;
  let ownedDragging: typeof editor.view.dragging = null;
  const cleanupDrag = () => {
    if (dragTimer) clearTimeout(dragTimer);
    dragTimer = null;
    dragImage?.remove();
    dragImage = null;
    document.removeEventListener('drop', cleanupDrag);
    if (ownedDragging && editor.view.dragging === ownedDragging)
      editor.view.dragging = null;
    ownedDragging = null;
    element.style.pointerEvents = 'auto';
  };
  const onDragStart = (event: DragEvent) => {
    cleanupDrag();
    const { view } = editor;
    if (!event.dataTransfer) return;
    const { empty, $from, $to } = view.state.selection;
    const nearCursor = getSelectionRangesNearCursor(event, editor);
    const selected = getSelectionRanges($from, $to, 0);
    const dragsSelection = selected.some((range) =>
      nearCursor.find(
        (near) => near.$from === range.$from && near.$to === range.$to
      )
    );
    const ranges = empty || !dragsSelection ? nearCursor : selected;
    if (!ranges.length) return;
    const { tr } = view.state;
    const image = document.createElement('div');
    const from = ranges[0].$from.pos;
    const to = ranges[ranges.length - 1].$to.pos;
    const selection = NodeRangeSelection.create(view.state.doc, from, to);
    const slice = selection.content();
    ranges.forEach((range) => {
      image.append(cloneElement(view.nodeDOM(range.$from.pos) as HTMLElement));
    });
    image.style.position = 'absolute';
    image.style.top = '-10000px';
    document.body.append(image);
    dragImage = image;
    event.dataTransfer.clearData();
    event.dataTransfer.setDragImage(image, 0, 0);
    view.dragging = { slice, move: true };
    ownedDragging = view.dragging;
    tr.setSelection(selection as unknown as Selection);
    view.dispatch(tr);
    document.addEventListener('drop', cleanupDrag, { once: true });
    dragTimer = setTimeout(() => {
      element.style.pointerEvents = 'none';
    }, 0);
  };

  return new Plugin<{ locked: boolean }>({
    key: typeof pluginKey === 'string' ? new PluginKey(pluginKey) : pluginKey,
    state: {
      init: () => ({ locked: false }),
      apply(tr, value) {
        const lock = tr.getMeta('lockDragHandle');
        if (lock !== undefined) locked = lock;
        if (tr.getMeta('hideDragHandle') && viewActive) {
          hideFloating();
          locked = false;
          setCurrentNode(null, -1);
          return value;
        }
        if (tr.docChanged && lastNodePos !== -1 && viewActive)
          lastNodePos = tr.mapping.map(lastNodePos);
        return value;
      },
    },
    view: (view) => {
      element.addEventListener('dragstart', onDragStart);
      element.addEventListener('dragend', cleanupDrag);
      element.draggable = true;
      element.style.pointerEvents = 'auto';
      editor.view.dom.parentElement?.appendChild(container);
      container.appendChild(floating);
      floating.appendChild(element);
      Object.assign(container.style, {
        pointerEvents: 'none',
        position: 'absolute',
        top: '0',
        left: '0',
      });
      viewActive = true;
      return {
        update(_view, prevState) {
          if (!viewActive) return;
          element.draggable = !locked;
          if (view.state.doc.eq(prevState.doc) || lastNodePos === -1) return;
          trackBlock(view, view.nodeDOM(lastNodePos));
        },
        destroy() {
          cleanupDrag();
          element.removeEventListener('dragstart', onDragStart);
          element.removeEventListener('dragend', cleanupDrag);
          hideFloating();
          removeNode(container);
          viewActive = false;
          currentNode = null;
          lastNodePos = -1;
        },
      };
    },
    props: {
      handleDOMEvents: {
        mouseleave: (_view, event) => {
          if (
            !locked &&
            event.target &&
            !container.contains(event.relatedTarget as Node | null)
          )
            hideDragHandle();
          return false;
        },
        mousemove(view, event) {
          if (!viewActive || locked) return false;
          if (event.buttons === 1) {
            hideDragHandle();
            return false;
          }
          const { resultElement } = findElementNextToCoords({
            x: event.clientX,
            y: event.clientY,
            direction: 'right',
            editor,
          });
          if (resultElement) trackBlock(view, resultElement);
          return false;
        },
      },
    },
  });
}
