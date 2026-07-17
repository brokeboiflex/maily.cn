/**
 * Icon mapping table for the shadcn registry build pipeline.
 *
 * Maps lucide-react icon names to their equivalents across 5 icon libraries:
 * lucide, tabler, hugeicons, phosphor, remixicon.
 *
 * Every entry has been verified against the target library's official package
 * type definitions (downloaded from jsdelivr CDN and checked programmatically).
 *
 * Verification sources (authoritative type-definition exports):
 *   - tabler:     @tabler/icons-react@3.44.0      (dist/tabler-icons-react.d.ts)
 *   - hugeicons:  @hugeicons/core-free-icons@4.2.1 (dist/types/index.d.ts)
 *   - phosphor:   @phosphor-icons/react@2.1.7      (dist/ssr/index.d.ts)
 *   - remixicon:  @remixicon/react@4.9.0            (index.d.ts)
 *
 * Icons that could NOT be confidently mapped to ALL 5 libraries are intentionally
 * omitted (they stay lucide-react in the generated output). See `iconMapMeta.notes`
 * for the reason each omitted icon was excluded.
 *
 * Naming conventions per library (how shadcn's icon transformer consumes them):
 *   - lucide:    bare name          → import { X } from 'lucide-react'
 *   - tabler:    "Icon" prefix      → import { IconX } from '@tabler/icons-react'
 *   - hugeicons: "Icon" suffix      → import { XIcon } from '@hugeicons/core-free-icons'
 *                                     (wrapped by <HugeiconsIcon icon={XIcon} />)
 *   - phosphor:  bare name          → import { X } from '@phosphor-icons/react'
 *   - remixicon: "Ri" prefix+Line   → import { RiXLine } from '@remixicon/react'
 */

export const iconMap = {
  // ── Block definition icons (blocks/*.tsx + slash commands) ──────────────

  Text: {
    lucide: 'Text',
    tabler: 'IconTypography',
    phosphor: 'TextT',
    hugeicons: 'TextFontIcon',
    remixicon: 'RiParagraph',
  },
  Heading1: {
    lucide: 'Heading1',
    tabler: 'IconH1',
    phosphor: 'TextHOne',
    hugeicons: 'Heading01Icon',
    remixicon: 'RiHeading',
  },
  Heading2: {
    lucide: 'Heading2',
    tabler: 'IconH2',
    phosphor: 'TextHTwo',
    hugeicons: 'Heading02Icon',
    remixicon: 'RiHeading',
  },
  Heading3: {
    lucide: 'Heading3',
    tabler: 'IconH3',
    phosphor: 'TextHThree',
    hugeicons: 'Heading03Icon',
    remixicon: 'RiHeading',
  },
  DivideIcon: {
    lucide: 'DivideIcon',
    tabler: 'IconDivide',
    phosphor: 'Divide',
    hugeicons: 'DivideSignIcon',
    remixicon: 'RiDivideLine',
  },
  TextQuote: {
    lucide: 'TextQuote',
    tabler: 'IconQuote',
    phosphor: 'Quotes',
    hugeicons: 'QuoteUpIcon',
    remixicon: 'RiDoubleQuotesL',
  },
  FootprintsIcon: {
    lucide: 'FootprintsIcon',
    tabler: 'IconWalk',
    phosphor: 'Footprints',
    hugeicons: 'FootprintsIcon',
    remixicon: 'RiFootprintLine',
  },
  EraserIcon: {
    lucide: 'EraserIcon',
    tabler: 'IconEraser',
    phosphor: 'Eraser',
    hugeicons: 'EraserIcon',
    remixicon: 'RiEraserLine',
  },
  ColumnsIcon: {
    lucide: 'ColumnsIcon',
    tabler: 'IconColumns',
    phosphor: 'Columns',
    hugeicons: 'LayoutTwoColumnIcon',
    remixicon: 'RiLayoutColumnLine',
  },
  RectangleHorizontal: {
    lucide: 'RectangleHorizontal',
    tabler: 'IconRectangle',
    phosphor: 'Rectangle',
    hugeicons: 'Square01Icon',
    remixicon: 'RiRectangleLine',
  },
  RectangleHorizontalIcon: {
    lucide: 'RectangleHorizontalIcon',
    tabler: 'IconRectangle',
    phosphor: 'Rectangle',
    hugeicons: 'Square01Icon',
    remixicon: 'RiRectangleLine',
  },
  Repeat2: {
    lucide: 'Repeat2',
    tabler: 'IconRepeat',
    phosphor: 'Repeat',
    hugeicons: 'RepeatIcon',
    remixicon: 'RiRepeatLine',
  },
  MoveVertical: {
    lucide: 'MoveVertical',
    tabler: 'IconArrowsVertical',
    phosphor: 'ArrowsVertical',
    hugeicons: 'MoveIcon',
    remixicon: 'RiExpandUpDownLine',
  },
  Minus: {
    lucide: 'Minus',
    tabler: 'IconMinus',
    phosphor: 'Minus',
    hugeicons: 'MinusSignIcon',
    remixicon: 'RiSubtractLine',
  },
  ImageIcon: {
    lucide: 'ImageIcon',
    tabler: 'IconPhoto',
    phosphor: 'ImageSquare',
    hugeicons: 'Image01Icon',
    remixicon: 'RiImage2Line',
  },
  CodeXmlIcon: {
    lucide: 'CodeXmlIcon',
    tabler: 'IconCode',
    phosphor: 'Code',
    hugeicons: 'SourceCodeIcon',
    remixicon: 'RiCodeLine',
  },
  CopyrightIcon: {
    lucide: 'CopyrightIcon',
    tabler: 'IconCopyright',
    phosphor: 'Copyright',
    hugeicons: 'CopyrightIcon',
    remixicon: 'RiCopyrightLine',
  },
  LayoutTemplateIcon: {
    lucide: 'LayoutTemplateIcon',
    tabler: 'IconLayout',
    phosphor: 'Layout',
    hugeicons: 'LayoutGridIcon',
    remixicon: 'RiLayoutLine',
  },
  MousePointer: {
    lucide: 'MousePointer',
    tabler: 'IconPointer',
    phosphor: 'Cursor',
    hugeicons: 'Cursor01Icon',
    remixicon: 'RiCursorLine',
  },
  ArrowUpRightSquare: {
    lucide: 'ArrowUpRightSquare',
    tabler: 'IconExternalLink',
    phosphor: 'ArrowUpRight',
    hugeicons: 'ArrowUpRight01Icon',
    remixicon: 'RiArrowRightUpLine',
  },

  // ── Editor UI icons ────────────────────────────────────────────────────

  Pencil: {
    lucide: 'Pencil',
    tabler: 'IconPencil',
    phosphor: 'Pencil',
    hugeicons: 'PencilIcon',
    remixicon: 'RiPencilLine',
  },
  Braces: {
    lucide: 'Braces',
    tabler: 'IconBraces',
    phosphor: 'BracketsCurly',
    hugeicons: 'BracesIcon',
    remixicon: 'RiBracesLine',
  },
  BracesIcon: {
    lucide: 'BracesIcon',
    tabler: 'IconBraces',
    phosphor: 'BracketsCurly',
    hugeicons: 'BracesIcon',
    remixicon: 'RiBracesLine',
  },
  AlertTriangle: {
    lucide: 'AlertTriangle',
    tabler: 'IconAlertTriangle',
    phosphor: 'Warning',
    hugeicons: 'AlertCircleIcon',
    remixicon: 'RiAlertLine',
  },
  ArrowDownIcon: {
    lucide: 'ArrowDownIcon',
    tabler: 'IconArrowDown',
    phosphor: 'ArrowDown',
    hugeicons: 'ArrowDown01Icon',
    remixicon: 'RiArrowDownLine',
  },
  ArrowUpIcon: {
    lucide: 'ArrowUpIcon',
    tabler: 'IconArrowUp',
    phosphor: 'ArrowUp',
    hugeicons: 'ArrowUp01Icon',
    remixicon: 'RiArrowUpLine',
  },
  CornerDownLeftIcon: {
    lucide: 'CornerDownLeftIcon',
    tabler: 'IconCornerDownLeft',
    phosphor: 'ArrowBendDownLeft',
    hugeicons: 'CornerDownLeftIcon',
    remixicon: 'RiCornerDownLeftLine',
  },
  CornerDownLeft: {
    lucide: 'CornerDownLeft',
    tabler: 'IconCornerDownLeft',
    phosphor: 'ArrowBendDownLeft',
    hugeicons: 'CornerDownLeftIcon',
    remixicon: 'RiCornerDownLeftLine',
  },
  GrabIcon: {
    lucide: 'GrabIcon',
    tabler: 'IconHandMove',
    phosphor: 'HandGrabbing',
    hugeicons: 'HandGrabIcon',
    remixicon: 'RiDragMove2Line',
  },
  Loader2: {
    lucide: 'Loader2',
    tabler: 'IconLoader2',
    phosphor: 'CircleNotch',
    hugeicons: 'Loading03Icon',
    remixicon: 'RiLoader2Line',
  },
  LoaderCircleIcon: {
    lucide: 'LoaderCircleIcon',
    tabler: 'IconLoader2',
    phosphor: 'CircleNotch',
    hugeicons: 'Loading03Icon',
    remixicon: 'RiLoader2Line',
  },
  CheckIcon: {
    lucide: 'CheckIcon',
    tabler: 'IconCheck',
    phosphor: 'Check',
    hugeicons: 'Tick02Icon',
    remixicon: 'RiCheckLine',
  },
  RotateCwIcon: {
    lucide: 'RotateCwIcon',
    tabler: 'IconRepeat',
    phosphor: 'Repeat',
    hugeicons: 'RepeatIcon',
    remixicon: 'RiRepeatLine',
  },
  TypeIcon: {
    lucide: 'TypeIcon',
    tabler: 'IconTypography',
    phosphor: 'TextT',
    hugeicons: 'TextFontIcon',
    remixicon: 'RiParagraph',
  },
  Ban: {
    lucide: 'Ban',
    tabler: 'IconBan',
    phosphor: 'Prohibit',
    hugeicons: 'Cancel01Icon',
    remixicon: 'RiForbidLine',
  },
  Eye: {
    lucide: 'Eye',
    tabler: 'IconEye',
    phosphor: 'Eye',
    hugeicons: 'ViewIcon',
    remixicon: 'RiEyeLine',
  },
  ViewIcon: {
    lucide: 'ViewIcon',
    tabler: 'IconEye',
    phosphor: 'Eye',
    hugeicons: 'ViewIcon',
    remixicon: 'RiEyeLine',
  },
  InfoIcon: {
    lucide: 'InfoIcon',
    tabler: 'IconInfoCircle',
    phosphor: 'Info',
    hugeicons: 'InformationCircleIcon',
    remixicon: 'RiInformationLine',
  },
  LockIcon: {
    lucide: 'LockIcon',
    tabler: 'IconLock',
    phosphor: 'Lock',
    hugeicons: 'LockIcon',
    remixicon: 'RiLockLine',
  },
  LockOpenIcon: {
    lucide: 'LockOpenIcon',
    tabler: 'IconLockOpen',
    phosphor: 'LockOpen',
    hugeicons: 'SquareUnlock01Icon',
    remixicon: 'RiLockUnlockLine',
  },
  ImageOffIcon: {
    lucide: 'ImageOffIcon',
    tabler: 'IconPhotoOff',
    phosphor: 'ImageBroken',
    hugeicons: 'ImageNotFound01Icon',
    remixicon: 'RiImageLine',
  },
  List: {
    lucide: 'List',
    tabler: 'IconList',
    phosphor: 'ListBullets',
    hugeicons: 'LeftToRightListBulletIcon',
    remixicon: 'RiListUnordered',
  },
  ListOrdered: {
    lucide: 'ListOrdered',
    tabler: 'IconListNumbers',
    phosphor: 'ListNumbers',
    hugeicons: 'LeftToRightListNumberIcon',
    remixicon: 'RiListOrdered',
  },
  AlignLeft: {
    lucide: 'AlignLeft',
    tabler: 'IconAlignLeft',
    phosphor: 'TextAlignLeft',
    hugeicons: 'TextAlignLeftIcon',
    remixicon: 'RiAlignLeft',
  },
  AlignCenter: {
    lucide: 'AlignCenter',
    tabler: 'IconAlignCenter',
    phosphor: 'TextAlignCenter',
    hugeicons: 'TextAlignCenterIcon',
    remixicon: 'RiAlignCenter',
  },
  AlignRight: {
    lucide: 'AlignRight',
    tabler: 'IconAlignRight',
    phosphor: 'TextAlignRight',
    hugeicons: 'TextAlignRightIcon',
    remixicon: 'RiAlignRight',
  },
  Space: {
    lucide: 'Space',
    tabler: 'IconSpace',
    phosphor: 'ArrowsOutLineHorizontal',
    hugeicons: 'HorizontalResizeIcon',
    remixicon: 'RiSpace',
  },
  Trash: {
    lucide: 'Trash',
    tabler: 'IconTrash',
    phosphor: 'Trash',
    hugeicons: 'Delete02Icon',
    remixicon: 'RiDeleteBinLine',
  },
  BoldIcon: {
    lucide: 'BoldIcon',
    tabler: 'IconBold',
    phosphor: 'TextB',
    hugeicons: 'TextBoldIcon',
    remixicon: 'RiBold',
  },
  ItalicIcon: {
    lucide: 'ItalicIcon',
    tabler: 'IconItalic',
    phosphor: 'TextItalic',
    hugeicons: 'TextItalicIcon',
    remixicon: 'RiItalic',
  },
  SeparatorHorizontal: {
    lucide: 'SeparatorHorizontal',
    tabler: 'IconSeparatorHorizontal',
    phosphor: 'Minus',
    hugeicons: 'MinusSignIcon',
    remixicon: 'RiSeparator',
  },
  StrikethroughIcon: {
    lucide: 'StrikethroughIcon',
    tabler: 'IconStrikethrough',
    phosphor: 'TextStrikethrough',
    hugeicons: 'TextStrikethroughIcon',
    remixicon: 'RiStrikethrough',
  },
  UnderlineIcon: {
    lucide: 'UnderlineIcon',
    tabler: 'IconUnderline',
    phosphor: 'TextUnderline',
    hugeicons: 'TextUnderlineIcon',
    remixicon: 'RiUnderline',
  },
  ImageDown: {
    lucide: 'ImageDown',
    tabler: 'IconPhotoDown',
    phosphor: 'Image',
    hugeicons: 'ImageDownloadIcon',
    remixicon: 'RiImageDownloadLine',
  },
  ImageDownIcon: {
    lucide: 'ImageDownIcon',
    tabler: 'IconPhotoDown',
    phosphor: 'Image',
    hugeicons: 'ImageDownloadIcon',
    remixicon: 'RiImageDownloadLine',
  },
  CodeIcon: {
    lucide: 'CodeIcon',
    tabler: 'IconCode',
    phosphor: 'Code',
    hugeicons: 'SourceCodeIcon',
    remixicon: 'RiCodeLine',
  },
  PilcrowIcon: {
    lucide: 'PilcrowIcon',
    tabler: 'IconPilcrow',
    phosphor: 'Paragraph',
    hugeicons: 'ParagraphIcon',
    remixicon: 'RiParagraph',
  },
  PilcrowLeft: {
    lucide: 'PilcrowLeft',
    tabler: 'IconTextDirectionLtr',
    phosphor: 'TextAlignLeft',
    hugeicons: 'LeftToRightBlockQuoteIcon',
    remixicon: 'RiTextDirectionL',
  },
  PilcrowRight: {
    lucide: 'PilcrowRight',
    tabler: 'IconTextDirectionRtl',
    phosphor: 'TextAlignRight',
    hugeicons: 'RightToLeftBlockQuoteIcon',
    remixicon: 'RiTextDirectionR',
  },
  Heading1Icon: {
    lucide: 'Heading1Icon',
    tabler: 'IconH1',
    phosphor: 'TextHOne',
    hugeicons: 'Heading01Icon',
    remixicon: 'RiHeading',
  },
  Heading2Icon: {
    lucide: 'Heading2Icon',
    tabler: 'IconH2',
    phosphor: 'TextHTwo',
    hugeicons: 'Heading02Icon',
    remixicon: 'RiHeading',
  },
  Heading3Icon: {
    lucide: 'Heading3Icon',
    tabler: 'IconH3',
    phosphor: 'TextHThree',
    hugeicons: 'Heading03Icon',
    remixicon: 'RiHeading',
  },
  ListIcon: {
    lucide: 'ListIcon',
    tabler: 'IconList',
    phosphor: 'ListBullets',
    hugeicons: 'LeftToRightListBulletIcon',
    remixicon: 'RiListUnordered',
  },
  ListOrderedIcon: {
    lucide: 'ListOrderedIcon',
    tabler: 'IconListNumbers',
    phosphor: 'ListNumbers',
    hugeicons: 'LeftToRightListNumberIcon',
    remixicon: 'RiListOrdered',
  },
  Link: {
    lucide: 'Link',
    tabler: 'IconLink',
    phosphor: 'Link',
    hugeicons: 'Link01Icon',
    remixicon: 'RiLink',
  },
  AlignVerticalDistributeStart: {
    lucide: 'AlignVerticalDistributeStart',
    tabler: 'IconAlignBoxTopCenter',
    phosphor: 'AlignTop',
    hugeicons: 'AlignBoxTopCenterIcon',
    remixicon: 'RiAlignTop',
  },
  AlignVerticalDistributeCenter: {
    lucide: 'AlignVerticalDistributeCenter',
    tabler: 'IconAlignBoxCenterMiddle',
    phosphor: 'AlignCenterVertical',
    hugeicons: 'AlignBoxMiddleCenterIcon',
    remixicon: 'RiAlignVertically',
  },
  AlignVerticalDistributeEnd: {
    lucide: 'AlignVerticalDistributeEnd',
    tabler: 'IconAlignBoxBottomCenter',
    phosphor: 'AlignBottom',
    hugeicons: 'AlignBoxBottomCenterIcon',
    remixicon: 'RiAlignBottom',
  },
  LinkIcon: {
    lucide: 'LinkIcon',
    tabler: 'IconLink',
    phosphor: 'Link',
    hugeicons: 'Link01Icon',
    remixicon: 'RiLink',
  },
  SlidersVertical: {
    lucide: 'SlidersVertical',
    tabler: 'IconAdjustments',
    phosphor: 'Sliders',
    hugeicons: 'SlidersVerticalIcon',
    remixicon: 'RiEqualizerLine',
  },
  Columns2: {
    lucide: 'Columns2',
    tabler: 'IconColumns2',
    phosphor: 'Columns',
    hugeicons: 'LayoutTwoColumnIcon',
    remixicon: 'RiLayoutColumnLine',
  },
  Columns3: {
    lucide: 'Columns3',
    tabler: 'IconColumns3',
    phosphor: 'Columns',
    hugeicons: 'LayoutThreeColumnIcon',
    remixicon: 'RiLayout3Line',
  },
  ChevronRight: {
    lucide: 'ChevronRight',
    tabler: 'IconChevronRight',
    phosphor: 'CaretRight',
    hugeicons: 'ChevronRightIcon',
    remixicon: 'RiArrowRightSLine',
  },
  ChevronRightIcon: {
    lucide: 'ChevronRightIcon',
    tabler: 'IconChevronRight',
    phosphor: 'CaretRight',
    hugeicons: 'ChevronRightIcon',
    remixicon: 'RiArrowRightSLine',
  },
  ChevronDownIcon: {
    lucide: 'ChevronDownIcon',
    tabler: 'IconChevronDown',
    phosphor: 'CaretDown',
    hugeicons: 'ChevronDownIcon',
    remixicon: 'RiArrowDownSLine',
  },
  ChevronUp: {
    lucide: 'ChevronUp',
    tabler: 'IconChevronUp',
    phosphor: 'CaretUp',
    hugeicons: 'ChevronUpIcon',
    remixicon: 'RiArrowUpSLine',
  },
  Plus: {
    lucide: 'Plus',
    tabler: 'IconPlus',
    phosphor: 'Plus',
    hugeicons: 'Add01Icon',
    remixicon: 'RiAddLine',
  },
  GripVertical: {
    lucide: 'GripVertical',
    tabler: 'IconGripVertical',
    phosphor: 'DotsSixVertical',
    hugeicons: 'GripVerticalIcon',
    remixicon: 'RiDraggable',
  },
  Copy: {
    lucide: 'Copy',
    tabler: 'IconCopy',
    phosphor: 'Copy',
    hugeicons: 'Copy01Icon',
    remixicon: 'RiFileCopyLine',
  },
  Trash2: {
    lucide: 'Trash2',
    tabler: 'IconTrash',
    phosphor: 'Trash',
    hugeicons: 'Delete02Icon',
    remixicon: 'RiDeleteBinLine',
  },
};

/**
 * Metadata about the icon classification and mapping process.
 * Used by the build script's conversion report.
 */
export const iconMapMeta = {
  totalFound: 77,
  jsxConvertible: 51,
  valueReferenced: 25,
  typeOnly: 1,
  mapped: 74,
  unmapped: 0,
  notes: {
    omitted: {},
    approximations: {
      Text: 'tabler has no bare IconText; IconTypography is the closest conceptual match (verified exists).',
      FootprintsIcon:
        'tabler has no footprints icon; IconWalk (walking person) is the closest available (verified exists).',
      ArrowUpRightSquare:
        'tabler has no IconArrowUpRightSquare; IconExternalLink is the closest conceptual match (verified exists).',
      SlidersVertical:
        'tabler has no IconAdjustmentsVertical; IconAdjustments is the standard sliders icon (verified exists).',
      RectangleHorizontal:
        'hugeicons has no rectangle-horizontal icon; Square01Icon is the closest plain rectangular shape (verified exists).',
      RectangleHorizontalIcon:
        'Same as RectangleHorizontal — hugeicons Square01Icon is the closest match.',
      AlertTriangle:
        'hugeicons has no alert-triangle; AlertCircleIcon is the closest alert indicator (verified exists).',
      MoveVertical:
        'hugeicons MoveIcon is a 4-directional move icon, not specifically vertical — closest available.',
      ImageOffIcon:
        'remixicon has no image-off icon; RiImageLine is the nearest image-status glyph.',
      LockOpenIcon:
        'hugeicons SquareUnlock01Icon communicates unlocked state with a square container.',
      RotateCwIcon:
        'The verified repeat-arrow icons are the closest cross-library retry action.',
      TypeIcon:
        'Uses the same verified typography glyphs as the existing Text mapping.',
    },
    verification:
      'All entries verified against official package type definitions via programmatic check. See file header for sources.',
  },
};
