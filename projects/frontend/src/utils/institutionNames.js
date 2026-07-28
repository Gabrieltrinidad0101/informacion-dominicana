import institutions from '../../../shared/institutions.json'

// Derived from the shared single-source registry. The frontend keys by the
// short `slug` and only shows institutions flagged `frontend: true`.
export const INSTITUTION_NAMES = Object.fromEntries(
  Object.values(institutions)
    .filter(i => i.frontend)
    .map(i => [i.slug, i.institutionName])
)
