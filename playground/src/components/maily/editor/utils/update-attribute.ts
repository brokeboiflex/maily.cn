import {
  type Command,
  type NodeViewProps,
  type RawCommands,
  getMarkType,
  getNodeType,
  getSchemaTypeNameByName,
} from "@tiptap/core"
import { type MarkType, type NodeType } from "@tiptap/pm/model"
import { type Transaction } from "@tiptap/pm/state"

/** Write the schema-normalized desired attributes only when markup changes. */
export function setNodeAttributes(
  tr: Transaction,
  pos: number,
  attrs: Record<string, any>
) {
  const node = tr.doc.nodeAt(pos)
  if (!node) return false
  const desired = node.type.create(attrs, node.content, node.marks)
  if (!node.sameMarkup(desired)) tr.setNodeMarkup(pos, undefined, desired.attrs)
  return true
}

/** NodeView writes bypass TipTap's updateAttributes command. Read the live node. */
export function updateNodeViewAttributes(
  { editor, node, getPos }: Pick<NodeViewProps, "editor" | "node" | "getPos">,
  attrs: Record<string, any>
) {
  if (editor.isDestroyed) return false
  return editor.commands.command(({ tr, dispatch }) => {
    const pos = getPos()
    if (typeof pos !== "number") return false
    const current = tr.doc.nodeAt(pos)
    if (!current || current.type !== node.type) return false
    return (
      !dispatch || setNodeAttributes(tr, pos, { ...current.attrs, ...attrs })
    )
  })
}

export function updateAttribute(
  type: string,
  attr: string,
  value: any
): Command {
  return updateAttributes(type, { [attr]: value })
}

/** Maily composites update the innermost matching selected node. */
export function updateAttributes(
  type: string,
  attrs: Record<string, any>
): Command {
  return ({ tr, dispatch }) => {
    let lastPos: number | undefined
    tr.selection.ranges.forEach((range) => {
      tr.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
        if (node.type.name === type) lastPos = pos
      })
    })
    if (dispatch && lastPos !== undefined) {
      const node = tr.doc.nodeAt(lastPos)!
      const steps = tr.steps.length
      setNodeAttributes(tr, lastPos, { ...node.attrs, ...attrs })
      if (type === "button" && tr.steps.length > steps)
        tr.setSelection(tr.selection)
    }
    return true
  }
}

/** TipTap 3 selection/return semantics, with per-target no-op node writes. */
export const updateSelectedAttributes: RawCommands["updateAttributes"] =
  (typeOrName, attributes = {}) =>
  ({ tr, dispatch }) => {
    const name = typeof typeOrName === "string" ? typeOrName : typeOrName.name
    const schema = tr.doc.type.schema
    const schemaType = getSchemaTypeNameByName(name, schema)
    const nodeType =
      schemaType === "node"
        ? getNodeType(typeOrName as NodeType, schema)
        : undefined
    const markType =
      schemaType === "mark"
        ? getMarkType(typeOrName as MarkType, schema)
        : undefined
    if (!nodeType && !markType) return false
    let canUpdate = false
    tr.selection.ranges.forEach(({ $from, $to }) => {
      const from = $from.pos
      const to = $to.pos
      let lastPos: number | undefined
      tr.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === nodeType) {
          canUpdate = true
          if (tr.selection.empty || pos < from) lastPos = pos
          else if (dispatch)
            setNodeAttributes(tr, pos, { ...node.attrs, ...attributes })
        }
        // Like TipTap, update existing marks only in a nonempty selection.
        if (!tr.selection.empty && pos >= from && pos <= to && markType) {
          node.marks.forEach((mark) => {
            if (mark.type !== markType) return
            canUpdate = true
            const desired = markType.create({ ...mark.attrs, ...attributes })
            if (dispatch && !mark.eq(desired)) {
              tr.addMark(
                Math.max(pos, from),
                Math.min(pos + node.nodeSize, to),
                desired
              )
            }
          })
        }
      })
      if (dispatch && lastPos !== undefined) {
        const node = tr.doc.nodeAt(lastPos)!
        setNodeAttributes(tr, lastPos, { ...node.attrs, ...attributes })
      }
    })
    return canUpdate
  }

export const resetSelectedAttributes: RawCommands["resetAttributes"] =
  (typeOrName, attributes) =>
  ({ tr, dispatch }) => {
    const name = typeof typeOrName === "string" ? typeOrName : typeOrName.name
    const schema = tr.doc.type.schema
    const schemaType = getSchemaTypeNameByName(name, schema)
    const nodeType =
      schemaType === "node"
        ? getNodeType(typeOrName as NodeType, schema)
        : undefined
    const markType =
      schemaType === "mark"
        ? getMarkType(typeOrName as MarkType, schema)
        : undefined
    if (!nodeType && !markType) return false
    const keys = Array.isArray(attributes) ? attributes : [attributes]
    const reset = (attrs: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => !keys.includes(key))
      )
    let canReset = false
    tr.selection.ranges.forEach(({ $from, $to }) => {
      tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type === nodeType) {
          canReset = true
          if (dispatch) setNodeAttributes(tr, pos, reset(node.attrs))
        }
        node.marks.forEach((mark) => {
          if (mark.type !== markType) return
          canReset = true
          const desired = mark.type.create(reset(mark.attrs))
          if (dispatch && !mark.eq(desired))
            tr.addMark(pos, pos + node.nodeSize, desired)
        })
      })
    })
    return canReset
  }
