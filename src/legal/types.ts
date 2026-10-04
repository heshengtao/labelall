/** Identifier of a legal document, as used in the URL hash. */
export type LegalDocId = 'privacy' | 'terms'

/**
 * A block of document content. Deliberately tiny: the legal text is authored as
 * structured data so the long-form copy stays out of the UI string catalogue
 * (which only allows flat, non-empty strings) and can be laid out with MUI.
 */
export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'links'; items: Array<{ label: string; href: string }> }

export interface LegalSection {
  id: string
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  title: string
  /** ISO date (YYYY-MM-DD); formatted per locale at render time. */
  updatedAt: string
  sections: LegalSection[]
}

export interface LegalBundle {
  privacy: LegalDocument
  terms: LegalDocument
}
