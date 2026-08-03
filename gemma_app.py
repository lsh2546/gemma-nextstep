"""NextStep: evidence-linked document actions powered by Gemma 4."""

import json
import re
from functools import lru_cache

import gradio as gr
from PIL import Image
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID = "google/gemma-4-E4B-it"

SYSTEM_PROMPT = """You are NextStep, a careful official-document assistant.
Analyze only facts visibly supported by the supplied document. Return exactly one
JSON object and no markdown. Never invent a deadline or required action. Each
action must cite an evidence id whose quote is copied from the document.

Schema:
{
  "document_type": "string",
  "source_language": "BCP-47 language code",
  "response_language": "en or vi",
  "headline": "short string",
  "actions": [
    {
      "title": "string",
      "detail": "string",
      "evidence_id": "E1",
      "confidence": "confirmed_from_document or uncertain"
    }
  ],
  "needs": ["string"],
  "evidence": [{"id": "E1", "quote": "exact source quote"}],
  "deadline": "ISO-8601 string or null",
  "private_fields_detected": ["field category"],
  "warnings": ["string"]
}
Return no more than three actions. If text is unreadable, explain that in warnings."""


@lru_cache(maxsize=1)
def load_gemma():
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForMultimodalLM.from_pretrained(
        MODEL_ID, dtype="auto", device_map="auto"
    )
    return processor, model


def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("Gemma did not return a JSON object.")
    result = json.loads(match.group(0))
    required = {"document_type", "actions", "needs", "evidence", "deadline"}
    missing = required.difference(result)
    if missing:
        raise ValueError(f"Missing required fields: {sorted(missing)}")
    warnings = result.setdefault("warnings", [])
    if len(result["actions"]) > 3:
        result["actions"] = result["actions"][:3]
        warnings.append("Gemma returned more than three actions; extra actions were removed.")
    evidence_ids = {item["id"] for item in result["evidence"]}
    for action in result["actions"]:
        if action.get("evidence_id") not in evidence_ids:
            action["confidence"] = "uncertain"
            warnings.append(
                f"{action.get('title', 'Action')} has no matching evidence."
            )
        elif action.get("confidence") not in {
            "confirmed_from_document",
            "uncertain",
        }:
            action["confidence"] = "confirmed_from_document"
            warnings.append(
                f"{action.get('title', 'Action')} had a non-schema confidence value; "
                "it was normalized after evidence validation."
            )
    deadline = result.get("deadline")
    if deadline is not None and not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?",
        str(deadline),
    ):
        result["deadline"] = None
        warnings.append(
            "Gemma returned a non-ISO deadline; it was cleared instead of guessed."
        )
    return result


def analyze_document(image, question, language):
    if image is None:
        raise gr.Error("Upload a document image first.")
    processor, model = load_gemma()
    image = Image.fromarray(image).convert("RGB")
    prompt = (
        f"Response language: {language}\n"
        f"User question: {question or 'What must I do, what do I need, and when is it due?'}\n"
        "Analyze the document and return the required JSON."
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ],
        },
    ]
    inputs = processor.apply_chat_template(
        messages,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
        add_generation_prompt=True,
        enable_thinking=False,
    ).to(model.device)
    input_length = inputs["input_ids"].shape[-1]
    output = model.generate(**inputs, max_new_tokens=1400, do_sample=False)
    decoded = processor.decode(output[0][input_length:], skip_special_tokens=True)
    result = extract_json(decoded)
    actions = "\n\n".join(
        f"### {i + 1}. {item['title']}\n{item['detail']}\n\n"
        f"`{item['evidence_id']} · {item['confidence']}`"
        for i, item in enumerate(result["actions"])
    )
    evidence = "\n\n".join(
        f"**{item['id']}** — {item['quote']}" for item in result["evidence"]
    )
    return actions, result, evidence


with gr.Blocks(title="NextStep · Gemma 4") as demo:
    gr.Markdown(
        "# NextStep\n"
        "**Turning Official Documents into Action with Gemma 4**\n\n"
        "Upload an official-document image. Gemma 4 extracts up to three "
        "evidence-linked actions without inventing unsupported requirements."
    )
    with gr.Row():
        with gr.Column():
            image_input = gr.Image(label="Official document", type="numpy")
            language_input = gr.Dropdown(
                ["English", "Vietnamese"], value="English", label="Response language"
            )
            question_input = gr.Textbox(
                value="What do I need to prepare and when is it due?",
                label="Question",
            )
            analyze_button = gr.Button("Analyze with Gemma 4", variant="primary")
        with gr.Column():
            actions_output = gr.Markdown("Your next actions will appear here.")
            json_output = gr.JSON(label="Validated structured output")
            evidence_output = gr.Markdown()
    analyze_button.click(
        analyze_document,
        [image_input, question_input, language_input],
        [actions_output, json_output, evidence_output],
    )


if __name__ == "__main__":
    demo.launch()

