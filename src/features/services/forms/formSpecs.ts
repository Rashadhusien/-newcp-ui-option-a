/**
 * Connect "Add/Create Service" controls for Biomodel and Conversion, typed
 * from the v0.6 form specs (docs/newcp-ai/payload/references/v06/
 * form_biomodel.json, form_conversion.json) and the validation matrix
 * (02_Validation_Rule_Matrix.csv). Evidence: UI_OBSERVED.
 *
 * - `code` is the v0.6 field key, used as the provisional API `fieldCode`
 *   until the tenant catalog codes are known (R02). Option codes are the
 *   v0.6 option values as strings, also provisional.
 * - `required` is set ONLY where the source attached Validators.required
 *   (VAL-*); validators the source defined but did not attach
 *   (VAL-NEST-001/002) are not enforced (CLAUDE.md, Forms).
 * - Visibility, dependent options and resets are local rules because the
 *   contract's `conditionalRules` shape is not defined yet (Q-B12).
 * - The CP staff fields (Redo, status, pending, cost, zero-charge, Bill To,
 *   currency, rush, internal comment) are edited on the instance detail
 *   (A7R), not here.
 */

import type { FormOption } from '@/shared/api';

export type FormKey = 'biomodel' | 'conversion';
export type ControlType = 'radio' | 'checkbox' | 'select' | 'text' | 'textarea';
export type FieldValue = string | boolean;
export type FormValues = Record<string, FieldValue>;

export interface FieldSpec {
  /** react-hook-form key (no dots). */
  key: string;
  /** API fieldCode (v0.6 key, provisional R02). */
  code: string;
  label: string;
  control: ControlType;
  section: string;
  /** Static options from the source; '' value = nothing chosen. */
  options?: readonly FormOption[];
  /** Options come from the form schema at runtime (source: "From runtime ..."). */
  runtimeOptions?: boolean;
  defaultValue: FieldValue;
  /** Shown only when this returns true (default: always). */
  visible?: (values: FormValues) => boolean;
  /** Sent even while hidden (a programmatic value, e.g. BSB format 13). */
  sendWhenHidden?: (values: FormValues) => boolean;
  /** Source-attached Validators.required, checked only while visible. */
  required?: boolean;
  /** Validation-matrix rule id behind `required` or the field's behaviour. */
  rule?: string;
  disabled?: (values: FormValues) => boolean;
  /** Narrows options by other answers. */
  filterOptions?: (options: readonly FormOption[], values: FormValues) => FormOption[];
}

export interface FormSpec {
  key: FormKey;
  title: string;
  sections: readonly string[];
  fields: readonly FieldSpec[];
}

const NO_YES_BOOL: readonly FormOption[] = [
  { code: 'false', label: 'No' },
  { code: 'true', label: 'Yes' },
];
const NO_YES_01: readonly FormOption[] = [
  { code: '0', label: 'No' },
  { code: '1', label: 'Yes' },
];
const BIOMODEL_CUSTOMIZATION: readonly FormOption[] = [
  { code: '0', label: 'None' },
  { code: '1', label: 'Full Arch' },
  { code: '2', label: 'Q-L' },
  { code: '3', label: 'Q-R' },
  { code: '4', label: 'Anterior' },
];
const BIOMODEL_COLOR: readonly FormOption[] = [
  { code: '0', label: 'Single' },
  { code: '1', label: 'Multicolor' },
];

const isDigital = (values: FormValues) => values.isDigitalDesign === 'true';

/** Printer model options carry their brand as `<brandCode>:<model>` (mock convention, Q-B12). */
export function modelsOfBrand(options: readonly FormOption[], brand: FieldValue): FormOption[] {
  return typeof brand === 'string' && brand !== ''
    ? options.filter((option) => option.code.startsWith(`${brand}:`))
    : [];
}

export const BIOMODEL_SPEC: FormSpec = {
  key: 'biomodel',
  title: 'Biomodel',
  sections: ['Design', 'Digital delivery', 'Order details'],
  fields: [
    {
      key: 'isDigitalDesign',
      code: 'isDigitalDesign',
      label: 'Is this digital design only?',
      control: 'radio',
      section: 'Design',
      options: NO_YES_BOOL,
      defaultValue: 'false',
      required: true,
      rule: 'VAL-BIO-002',
    },
    {
      key: 'customizationMaxilla',
      code: 'customizationMaxilla',
      label: 'Customization (maxilla)',
      control: 'radio',
      section: 'Design',
      options: BIOMODEL_CUSTOMIZATION,
      defaultValue: '0',
      rule: 'VAL-BIO-001',
    },
    {
      key: 'customizationMandible',
      code: 'customizationMandible',
      label: 'Customization (mandible)',
      control: 'radio',
      section: 'Design',
      options: BIOMODEL_CUSTOMIZATION,
      defaultValue: '0',
      rule: 'VAL-BIO-001',
    },
    {
      key: 'colorMaxilla',
      code: 'colorMaxilla',
      label: 'Color (maxilla)',
      control: 'radio',
      section: 'Design',
      options: BIOMODEL_COLOR,
      defaultValue: '0',
      visible: (values) => values.customizationMaxilla !== '0',
    },
    {
      key: 'colorMandible',
      code: 'colorMandible',
      label: 'Color (mandible)',
      control: 'radio',
      section: 'Design',
      options: BIOMODEL_COLOR,
      defaultValue: '0',
      visible: (values) => values.customizationMandible !== '0',
    },
    {
      key: 'nestingDesign',
      code: 'nestingDesign',
      label: 'Should we nest the design?',
      control: 'radio',
      section: 'Digital delivery',
      options: NO_YES_BOOL,
      defaultValue: 'false',
      visible: isDigital,
    },
    {
      key: 'deliverStl',
      code: 'deliverablesgroup.stl',
      label: 'Deliver as STL',
      control: 'checkbox',
      section: 'Digital delivery',
      defaultValue: true,
      visible: isDigital,
      rule: 'VAL-BIO-003',
    },
    {
      key: 'deliverSoftwareFile',
      code: 'deliverablesgroup.softwareFile',
      label: 'Deliver as software file',
      control: 'checkbox',
      section: 'Digital delivery',
      defaultValue: false,
      visible: isDigital,
      rule: 'VAL-BIO-003',
    },
    {
      key: 'softwareDesign',
      code: 'deliverablesgroup.softwareDesign',
      label: 'Software for delivery',
      control: 'select',
      section: 'Digital delivery',
      runtimeOptions: true,
      defaultValue: '',
      visible: (values) => isDigital(values) && values.deliverSoftwareFile === true,
    },
    {
      key: 'printerBrand',
      code: 'printerGroup.printerBrand',
      label: '3D printer brand',
      control: 'select',
      section: 'Digital delivery',
      runtimeOptions: true,
      defaultValue: '',
      visible: isDigital,
    },
    {
      key: 'printerModel',
      code: 'printerGroup.printerModel',
      label: '3D printer model',
      control: 'select',
      section: 'Digital delivery',
      runtimeOptions: true,
      defaultValue: '',
      visible: isDigital,
      disabled: (values) => values.printerBrand === '',
      filterOptions: (options, values) => modelsOfBrand(options, values.printerBrand),
    },
    {
      key: 'printerResin',
      code: 'printerGroup.printerResin',
      label: 'Printer resin',
      control: 'text',
      section: 'Digital delivery',
      defaultValue: '',
      visible: isDigital,
    },
    {
      key: 'rush',
      code: 'rush',
      label: 'Rush if possible',
      control: 'radio',
      section: 'Order details',
      options: NO_YES_01,
      defaultValue: '0',
    },
    {
      key: 'hasRequiredFiles',
      code: 'hasRequiredFiles',
      label: 'Has required files',
      control: 'checkbox',
      section: 'Order details',
      defaultValue: false,
    },
    {
      key: 'rxNote',
      code: 'rxNote',
      label: 'RX note',
      control: 'textarea',
      section: 'Order details',
      defaultValue: '',
    },
  ],
};

const CONVERSION_ARCH: readonly FormOption[] = [
  { code: '20', label: 'None' },
  { code: '21', label: 'Full Arch' },
  { code: '22', label: 'Left Quad' },
  { code: '23', label: 'Right Quad' },
  { code: '24', label: 'Anterior Sextant' },
];
const CONVERSION_SEGMENTATION: readonly FormOption[] = [
  { code: '1', label: 'Custom' },
  { code: '2', label: 'Basic' },
];
const SIMPLANT = '1';
const CODIAGNOSTIX = '3';
const BSB = '6';
/** Format the source sets when software changes (VAL-CONV-002); BSB's 13 is internal and hidden. */
export const FORMAT_FOR_SOFTWARE: Readonly<Record<string, string>> = {
  [SIMPLANT]: '1',
  [CODIAGNOSTIX]: '8',
  [BSB]: '13',
};
const FORMATS_FOR_SOFTWARE: Readonly<Record<string, readonly string[]>> = {
  [SIMPLANT]: ['1', '2', '3', '4', '5'],
  [CODIAGNOSTIX]: ['8', '9'],
};

export const CONVERSION_SPEC: FormSpec = {
  key: 'conversion',
  title: 'Conversion',
  sections: ['Software', 'Arches', 'Scans', 'Notes'],
  fields: [
    {
      key: 'software',
      code: 'software',
      label: 'Software',
      control: 'radio',
      section: 'Software',
      options: [
        { code: SIMPLANT, label: 'Simplant' },
        { code: CODIAGNOSTIX, label: 'coDiagnostiX' },
        { code: BSB, label: 'BSB' },
      ],
      defaultValue: SIMPLANT,
      required: true,
      rule: 'VAL-CONV-001',
    },
    {
      key: 'format',
      code: 'format',
      label: 'Format',
      control: 'radio',
      section: 'Software',
      options: [
        { code: '1', label: 'Planner' },
        { code: '2', label: 'Pro' },
        { code: '3', label: 'Viewer' },
        { code: '4', label: 'Master' },
        { code: '5', label: 'OneShot' },
        { code: '8', label: 'CaseXchange' },
        { code: '9', label: '3DDXConnect' },
      ],
      defaultValue: '1',
      visible: (values) => values.software !== BSB,
      sendWhenHidden: (values) => values.software === BSB,
      required: true,
      rule: 'VAL-CONV-002',
      filterOptions: (options, values) => {
        const allowed = FORMATS_FOR_SOFTWARE[String(values.software)] ?? [];
        return options.filter((option) => allowed.includes(option.code));
      },
    },
    {
      key: 'portableVersion',
      code: 'portableVersion',
      label: 'Portable version',
      control: 'radio',
      section: 'Software',
      options: [
        { code: '1', label: 'No' },
        { code: '2', label: 'Yes' },
      ],
      defaultValue: '1',
      required: true,
    },
    {
      key: 'maxilla',
      code: 'maxilla',
      label: 'Maxilla',
      control: 'radio',
      section: 'Arches',
      options: CONVERSION_ARCH,
      defaultValue: '20',
      required: true,
      rule: 'VAL-CONV-003',
    },
    {
      key: 'typeMaxilla',
      code: 'typeMaxilla',
      label: 'Maxilla segmentation',
      control: 'radio',
      section: 'Arches',
      options: CONVERSION_SEGMENTATION,
      defaultValue: '1',
      visible: (values) => values.maxilla !== '20',
      required: true,
      rule: 'VAL-CONV-004',
    },
    {
      key: 'mandible',
      code: 'mandible',
      label: 'Mandible',
      control: 'radio',
      section: 'Arches',
      options: CONVERSION_ARCH,
      defaultValue: '20',
      required: true,
      rule: 'VAL-CONV-003',
    },
    {
      key: 'typeMandible',
      code: 'typeMandible',
      label: 'Mandible segmentation',
      control: 'radio',
      section: 'Arches',
      options: CONVERSION_SEGMENTATION,
      defaultValue: '1',
      visible: (values) => values.mandible !== '20',
      required: true,
      rule: 'VAL-CONV-004',
    },
    {
      key: 'separateDoubleArchOrder',
      code: 'separateDoubleArchOrder',
      label: 'Deliver each arch in a separate file?',
      control: 'checkbox',
      section: 'Arches',
      defaultValue: false,
      // Source condition, verbatim: maxilla != 20 and modelScan != 1 (VAL-CONV-006).
      visible: (values) => values.maxilla !== '20' && values.modelScan !== '1',
      rule: 'VAL-CONV-006',
    },
    {
      key: 'modelScan',
      code: 'modelScan',
      label: 'Model scan',
      control: 'radio',
      section: 'Scans',
      options: NO_YES_01,
      defaultValue: '0',
      required: true,
      rule: 'VAL-CONV-005',
    },
    {
      key: 'oral',
      code: 'oral',
      label: 'Have intraoral scan for patient?',
      control: 'radio',
      section: 'Scans',
      options: [
        { code: '1', label: 'No' },
        { code: '2', label: 'Yes' },
      ],
      defaultValue: '',
      visible: (values) => values.modelScan === '1',
      required: true,
      rule: 'VAL-CONV-005',
    },
    {
      key: 'generalComment',
      code: 'generalComment',
      label: 'RX note / general comment',
      control: 'textarea',
      section: 'Notes',
      defaultValue: '',
    },
  ],
};
