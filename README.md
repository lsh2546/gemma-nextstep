---
title: NextStep
emoji: 📄
colorFrom: green
colorTo: yellow
sdk: static
app_file: index.html
pinned: false
---

# NextStep

**Turning Official Documents into Action with Gemma 4**

NextStep is a local-ready prototype that transforms an official document into three evidence-linked actions, an ICS calendar event, a persistent checklist, and a privacy-safe help card.

> **You only need to do 3 things.** Every action must point back to quoted source
> evidence.

## Judge quick verification

1. Open the public Static Space and select **Analyze with NextStep**.
2. Confirm that the result contains exactly three actions, required items,
   Korean source quotations, confidence labels, and inspectable JSON.
3. Inspect `analyze_document()` and `extract_json()` in `gemma_app.py` for the
   Gemma 4 multimodal inference and deterministic grounding safeguards.

The public Space demonstrates the complete interaction workflow without an
account or model download. The Python implementation is kept in the public
repository because a free Static Space cannot execute Python or host Gemma 4
weights.

## Current prototype

This repository contains a fully working static vertical slice for the representative scenario:

- Korean school notice upload
- English or Vietnamese question/response mode
- Three structured actions
- Source evidence and confidence labels
- `.ics` calendar file export
- Locally saved checklist
- Redacted multilingual help card

The static browser demo uses deterministic sample data so the product flow can
be inspected without downloading model weights. The submission app in
`gemma_app.py` sends the uploaded image to the instruction-tuned
`google/gemma-4-E4B-it` model and validates its evidence-linked JSON output.

## Run

### Gemma-powered reference implementation

The free Static Space hosts the interactive UX preview and does not run Python
or model weights. To reproduce the actual Gemma 4 inference path in a Kaggle
Notebook or GPU Python environment, accept the model terms, authenticate to
Hugging Face, and run:

```bash
pip install -r requirements.txt
python app.py
```

### Public Static Space demo

The default Hugging Face Space configuration serves `index.html`. Locally, open
it directly or serve the folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Gemma 4 integration boundary

The implementation boundary is `analyze_document()` in `gemma_app.py`. It:

1. Accepts a document image, user question, and response language.
2. Calls Gemma 4 E4B multimodal inference.
3. Requires quoted source evidence for each action.
4. Downgrades unmatched action/evidence references to `uncertain`.
5. Returns structured JSON matching the UI contract.

```text
Document image + question
          |
          v
Gemma 4 E4B multimodal inference
          |
          v
Evidence-linked action JSON
          |
          v
Deterministic schema/reference validation
          |
          v
3 actions + calendar + checklist + redacted help card
```

Hosted demo and local mode must be described separately. Do not claim fully
private/offline operation until local inference has been verified on the target
device.

