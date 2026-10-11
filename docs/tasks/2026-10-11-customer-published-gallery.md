# Customer published photo gallery

Reuses the existing CanonPortalPhotoGallery in the current portal route. The old component queried internal project media, collapsed access/transport failures to empty success and opened raw Storage URLs. The new component consumes only the safe published DTO and authenticated original gateway delivered in #429. The retained #244 visual-progress work was inspected; its signed customer URLs and silent error handling are not restored.

The reader verifies project binding, verified flag and exact same-project original route, and strips additional fields. HTTP failures remain errors. The real component hides previously successful images/links on refetch failure, separates denied/empty/temporary failure, supports retry and failed-original feedback, and revalidates on focus and every30 seconds while mounted. No image optimizer/shared cache is used; server originals are no-store. Already downloaded bytes cannot be erased remotely.

15 meaningful reader/rendered behavior checks PASS: request/cookie/cache scope, safe DTO, wrong-project/external/token URLs,401/403/404/503, stale-cache removal after revocation, retry recovery, publication withdrawal and unavailable original. Typecheck/scoped lint and en/ru/es/it state-key parity PASS. Matching Customer localization resources are prepared; this slice does not deliver an iOS gallery or claim store readiness. Android Customer does not exist and AndroidD2 remains deferred.

Protected integration and staging publication must follow #429's actual live original/publication/grant proof. Report→evidence assembly, explicit manager publication controls and iOS gallery remain separate focused follow-ups; synthetic fixture setup does not prove the full report product lifecycle.
