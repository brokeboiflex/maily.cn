# Folder loading and block-dropdown anchor repairs

The mailbox's controlled folder acceptance invalidated the read that had just
started for the accepted folder. Selecting the current folder also invalidated
an in-flight read without starting a replacement. The query owner already
invalidates obsolete requests; removing the extra generation increment keeps
the current read responsible for its rows and loading cleanup.

The text bubble's block dropdown opens on pointerdown. Its portal can take
focus before native trigger focus, causing TipTap to detach the bubble and
leave the dropdown with a disconnected anchor. The Maily trigger now focuses
itself before the dropdown opens. Host primitives and TipTap are unchanged.

Three regressions were observed failing before these changes and passing after:
host-accepted folder navigation, active-folder reselection during a read, and
the real TipTap/Radix dropdown retaining its anchor and executing its command.
All 327 core tests, core typecheck, changed-source ESLint and the primitive audit
passed. Regenerated registry JSON and refreshed the affected playground files
through shadcn CLI transformation. No browser geometry validation or publication
was performed.
