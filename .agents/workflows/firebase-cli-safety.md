---
description: safety rules for firebase CLI commands to prevent accidental data deletion
---

# Firebase CLI Safety Rules

> [!CAUTION]
> On 2026-03-03 the command `firebase firestore:delete --all-collections` accidentally deleted the ENTIRE Firestore database (2864 documents). Data was recovered via PITR. These rules exist to prevent this from ever happening again.

## ✅ Safe Commands (Auto-run OK)

```bash
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase functions:log --lines 50
```

## ⛔ NEVER Auto-run — Always Require Manual Review

```bash
# NEVER delete at the collection level with --all-collections
firebase firestore:delete --all-collections  # ← DELETED THE ENTIRE DATABASE

# NEVER delete without specifying the exact document path
firebase firestore:delete [collection]  # Without -r is still dangerous
```

## ✅ Correct Way to Delete a Single Firestore Document

To delete one document (e.g., a test `abandoned_carts` entry):

```bash
# Correct: specify the full document path (collection/documentId)
firebase firestore:delete abandoned_carts/user@example.com --project rostrodorado-80279
```

To delete an entire collection safely:
```bash
# Correct: specify only the collection path with --recursive
firebase firestore:delete abandoned_carts --recursive --project rostrodorado-80279
# This only deletes documents within abandoned_carts, NOT the whole database
```

## 🔧 Current Database Configuration

- **Named Database**: `rostrodorado-db`  (recovered from PITR on 2026-03-03)
- **Original default DB**: `(default)` — was accidentally wiped, now abandoned
- **PITR**: Enabled, 7-day retention — **DO NOT DISABLE**

## 📋 Pre-Deletion Checklist

Before running ANY `firestore:delete` command:
1. [ ] Confirm the exact document/collection path
2. [ ] Do NOT use `--all-collections` unless explicitly deleting everything
3. [ ] Take a manual export first: `gcloud firestore export gs://[BUCKET]`
4. [ ] Confirm PITR is enabled in Firebase Console → Firestore → "Recuperación ante desastres"
