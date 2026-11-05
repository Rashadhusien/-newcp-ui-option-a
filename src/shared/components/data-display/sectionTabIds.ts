/** Ids that link a SectionTabs tab to its panel (aria-controls / aria-labelledby). */

export function sectionTabIds(idPrefix: string, value: string): { tab: string; panel: string } {
  return { tab: `${idPrefix}-tab-${value}`, panel: `${idPrefix}-panel-${value}` };
}
