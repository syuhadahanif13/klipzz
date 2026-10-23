-- ============================================================================
-- Remove demo/social seed accounts
--
-- The submit modal must only show social accounts that a real user verified
-- through the Bio Code Challenge. These rows came from seed/demo data and were
-- already marked verified, so they appeared as fake "verified" accounts.
--
-- This migration intentionally deletes only the known demo ids/handles. Real
-- accounts created later are untouched.
-- ============================================================================

DELETE FROM public.social_accounts
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444',
  '3d547cfd-eaa7-492a-868b-09c3ee78658b',
  '5f87b18b-cc3a-419e-8680-74e309a55191'
)
OR (
  user_id IN (
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  )
  AND handle IN (
    '@fajar.ngelipzz',
    '@fajar_reelsfunny',
    '@sitiklips',
    '@budicomedy.id',
    '@hans.cutter',
    '@hans_klipzz'
  )
);
