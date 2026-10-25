# Sky Dominators (Air Strike: Tactical Flight Combat)

Retro 8-bit tactical flight combat vocabulary game integrated with **Lexical Space** via IndexedDB and global persistent sortie leaderboards via **Google Firebase Cloud Firestore**.

## 🚀 Production Deployment
- **Play Online:** [https://vuongtranvt1331-design.github.io/Sky_Dominators/](https://vuongtranvt1331-design.github.io/Sky_Dominators/)
- **Arcade Hub:** [https://vuongtranvt1331-design.github.io/Arcadehub/](https://vuongtranvt1331-design.github.io/Arcadehub/)
- **Lexical Space:** [https://vuongtranvt1331-design.github.io/Lexical_Space/](https://vuongtranvt1331-design.github.io/Lexical_Space/)

## ☁️ Firebase Cloud Firestore Configuration
- **Project ID:** `skydominators`
- **Collections:**
  - `leaderboard/{matchId}`: Global sortable sortie telemetry with rank medals.
  - `legends/{nickname}`: Permanent Hall of Fame ensuring historical #1 achievement badges are never lost.

## 📚 Shared IndexedDB Vocabulary
- **Database:** `LexicalSpaceDB` (v1)
- **Object Store:** `words`
- **Protocol:** Read-only access preserving student progress, with instant fallback to a built-in 30-word academic IELTS deck when offline.
