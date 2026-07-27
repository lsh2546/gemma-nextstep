# NextStep: Turning Official Documents into Action

## Evidence-linked multilingual guidance for families and local communities

**Track: Local Innovation**

Official documents often contain critical deadlines and required actions, but
translation alone does not tell people what to do. This is especially difficult
for immigrant families and multilingual households navigating school, health,
housing, and local-government notices.

NextStep converts an official-document image into no more than three clear
actions. Each action is linked to an exact quotation from the source document.
The user can ask a question in plain language, choose English or Vietnamese, and
receive required items, a deadline, confidence labels, and structured JSON.

## Gemma 4 implementation

The submission application uses `google/gemma-4-E4B-it`. The uploaded document
image and user question are passed through `AutoProcessor.apply_chat_template`
to `AutoModelForMultimodalLM`. The prompt requires a constrained JSON object
containing the document type, source and response languages, actions, needs,
evidence, deadline, detected private-field categories, and warnings.

Gemma 4 is central to the workflow: it reads the document image, interprets
Korean administrative language, answers in the selected language, and connects
each recommended action to evidence copied from the document.

Application code then validates the response. Required top-level fields must be
present, and every `evidence_id` used by an action must match an evidence object.
An unmatched action is downgraded to `uncertain` and a warning is added. This
separates probabilistic document understanding from deterministic safeguards.

The repository also contains a static UX preview using validated sample output.
It is clearly separated from the Gemma-powered Gradio application and is not
presented as live model inference.

## Representative scenario

Our sprint prototype focuses on a Korean school field-day notice. A family asks:
“What do I need to prepare and when is it due?” NextStep identifies a guardian
signature, required sports items, and the submission deadline. Instead of
returning only a translation, it displays three prioritized actions and the
Korean sentence supporting each one.

This scenario demonstrates a broader problem. The same workflow can assist with
local-government letters, hospital preparation instructions, public-health
announcements, housing communications, and emergency notices.

## Architecture

The prototype has four stages:

1. The user supplies a document image, question, and response language.
2. Gemma 4 performs multimodal document understanding and returns structured
   evidence-linked actions.
3. Deterministic validation checks required fields and evidence references.
4. The UI renders actions, requirements, warnings, and inspectable JSON.

The action JSON is designed to drive narrowly scoped tools such as calendar
event creation, checklist storage, and generation of a redacted help card.
Model output proposes the structured action plan; application code remains
responsible for executing and validating tools.

## Local innovation and privacy

Notices can contain student names, addresses, phone numbers, identifiers, and
medical information. NextStep therefore records categories of detected private
fields and is designed for deployment with smaller Gemma variants on local or
edge hardware.

The sprint build does not claim that every hosted execution is private or
offline. Hosted inference and local deployment are described separately. This
distinction is part of the product design: users should know where their
documents are processed.

## Engineering challenges

The primary challenge was grounding. A fluent translation can still cause harm
if it invents a deadline or treats an optional item as mandatory. We made
evidence linkage part of the output contract rather than an optional
explanation.

Multilingual output also required action-oriented language. Formal
administrative expressions often remain confusing after literal translation.
Short action titles and explicit required-item lists reduce that burden.

Finally, we kept the sprint scope narrow. A deterministic vertical slice allowed
the complete interaction to be designed before adding the heavier multimodal
runtime. The final repository preserves both layers and labels them clearly.

## Impact and next steps

NextStep demonstrates how open multimodal models can turn institutional language
into safe, immediate action. Future work includes PDF page support, stronger
schema-constrained decoding, additional community languages, verified
on-device inference, and deterministic calendar/checklist/help-card tools driven
by validated model output.

Our core principle is:

> Do not just translate the document. Complete the next step—and show the
> evidence.

**Public code:** `https://github.com/lsh2546/gemma-nextstep`

**Live UX demo:** `https://huggingface.co/spaces/lsh2546/gemma-nextstep`

