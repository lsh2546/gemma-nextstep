# NextStep · Gemma 4 submission build

NextStep turns an official-document image into up to three evidence-linked
actions in English or Vietnamese. The inference path uses the instruction-tuned
`google/gemma-4-E4B-it` multimodal model.

## What is real

- The uploaded image is passed to Gemma 4.
- Gemma returns structured JSON containing actions, needs, evidence and deadline.
- Application code validates required fields and evidence references.
- Unsupported action/evidence links are downgraded to `uncertain`.

The older `index.html` demo remains as a deterministic UX preview. The
submission implementation is `gemma_app.py`; do not describe the static preview
as model-powered.

## Run

1. Accept access terms for `google/gemma-4-E4B-it` on Hugging Face.
2. Authenticate with `huggingface-cli login` or set `HF_TOKEN`.
3. Use a GPU runtime and install dependencies:

```bash
pip install -r requirements.txt
python gemma_app.py
```

## Hugging Face Spaces

Create a Gradio Space, upload this repository, select a GPU runtime, and add
`HF_TOKEN` as a Space secret. The app entry point is `gemma_app.py`; rename it
to `app.py` for the default Space configuration.

## Kaggle

Enable a GPU accelerator, add a Hugging Face token through Kaggle Secrets, and
run the application code. The model weights are gated, so the account executing
the notebook must have accepted the model terms.

## Safety boundary

NextStep is a prototype and must not be used as the sole basis for medical,
legal, immigration or emergency decisions. Users should verify actions against
the displayed source evidence.

