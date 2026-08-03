# NextStep Gemma 4 verification

## Environment

- Platform: Kaggle Notebook
- Accelerator: NVIDIA Tesla T4 x2
- Model: `google/gemma-4-E4B-it`
- Model weights: 16.0 GB
- Transformers: 5.14.1
- Processor: `Gemma4Processor`

## Test

A generated school-notice image contained three facts:

1. A guardian signature is required.
2. Sports shoes, a water bottle, and a hat are required.
3. The signed form is due to the homeroom teacher by August 3.

The image and a JSON-only instruction were passed through
`AutoProcessor.apply_chat_template` and `AutoModelForMultimodalLM.generate`.

## Result

The model returned exactly three actions and three matching evidence quotations:

- Guardian Signature → “Guardian signature is required.”
- Bring Supplies → “Bring sports shoes, a water bottle, and a hat.”
- Submit Form → “Submit the signed form to the homeroom teacher by August 3.”

The run completed with:

```text
MODEL WEIGHTS LOAD: PASS
END-TO-END MULTIMODAL INFERENCE: PASS
```

## Finding and mitigation

The model returned numeric confidence values and `August 3` rather than the
requested confidence enum and ISO-8601 deadline. The deterministic validator was
therefore strengthened to:

- cap output at three actions;
- normalize evidence-backed confidence values;
- downgrade unmatched evidence references to `uncertain`;
- clear non-ISO deadlines instead of inventing a date.

This verification demonstrates real multimodal inference while documenting the
remaining difference between the hosted Static UX demo and the reproducible GPU
model path.

