import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_MODEL = "llama3-70b-8192"

_groq_client = None


def get_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set. Add it to your .env file.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client

LEVEL_INSTRUCTIONS = {
    "school": (
        "The student is in school (ages 12–16). Use simple, friendly language with real-world analogies. "
        "Avoid jargon. Explain concepts as if to a curious teenager. Use relatable examples from everyday life."
    ),
    "college": (
        "The student is in college. Use moderate depth with formal terminology introduced gradually. "
        "Include some mathematical or theoretical grounding alongside practical examples."
    ),
    "university": (
        "The student is at university level. Use advanced, rigorous language with formal definitions, "
        "proofs where applicable, research-level insights, and domain-specific notation."
    ),
    "selflearn": (
        "The learner is self-taught and practical. Skip unnecessary theory. Focus on how things work "
        "in the real world with actionable steps, project ideas, and concrete use cases."
    ),
}

DEPTH_INSTRUCTIONS = {
    "quick": "Generate a Quick Overview of 500–800 words covering the core idea, key terms, and one or two examples.",
    "standard": (
        "Generate Standard notes of 1200–2000 words with a full explanation, step-by-step breakdown, "
        "examples, and answers to common questions."
    ),
    "deepdive": (
        "Generate a Deep Dive of 3000+ words covering everything from prerequisites to advanced theory. "
        "Cover all sub-topics thoroughly including edge cases, advanced applications, and open problems."
    ),
}

DOMAIN_CONVENTIONS = {
    "technology": "Include real-world tech examples, tools, and industry context.",
    "cs": "Include code snippets (properly fenced with language tags), algorithms, and complexity analysis.",
    "mathematics": "Include formulas, proofs, and step-by-step derivations using proper notation.",
    "physics": "Include formulas, unit analysis, and physical intuition.",
    "chemistry": "Include chemical equations, molecular structures described in text, and reaction mechanisms.",
    "biology": "Include biological terminology, diagrams described in text, and life-process explanations.",
    "mechanical": "Include engineering principles, equations, and real mechanical system examples.",
    "electrical": "Include circuit concepts, equations, and electronic system examples.",
    "science": "Use general scientific method, key concepts, and cross-domain examples.",
    "humanities": "Include cultural context, key thinkers, and critical perspectives.",
    "economics": "Include economic models, graphs described in text, and real-world policy examples.",
    "history": "Include timelines, key events, dates, and cause-effect analysis.",
    "medicine": "Include medical terminology, physiological mechanisms, and clinical relevance.",
    "law": "Include legal principles, landmark cases, and constitutional context.",
    "environment": "Include ecological concepts, data trends, and sustainability context.",
    "psychology": "Include psychological theories, experiments, and behavioral examples.",
    "philosophy": "Include philosophical arguments, key thinkers, and logical analysis.",
    "architecture": "Include design principles, historical styles, and structural concepts.",
}


def build_system_prompt(level: str, domain: str, depth: str) -> str:
    level_inst = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["college"])
    depth_inst = DEPTH_INSTRUCTIONS.get(depth, DEPTH_INSTRUCTIONS["standard"])
    domain_inst = DOMAIN_CONVENTIONS.get(domain, "Use relevant domain-specific conventions and examples.")

    return f"""You are NoteVerse AI — an expert educator and knowledge synthesizer.

AUDIENCE & TONE:
{level_inst}

LENGTH & DEPTH:
{depth_inst}

DOMAIN CONVENTIONS:
{domain_inst}

OUTPUT FORMAT RULES:
- Always respond in well-structured Markdown. Never use plain prose paragraphs without structure.
- Use the following STRICT template every time:

## Introduction
## Prerequisites
## Core Concepts
## Step-by-Step Explanation
## Technical / Mathematical Formulation *(omit if not applicable)*
## Real-World Examples & Applications
## Visual Description / Analogies
## Advanced Topics *(only for deep dive)*
## Key Insights
> 💡 **Key Insight:** ...
## Common Mistakes
> ⚠️ **Common Mistake:** ...
## Summary
## Practice Questions
Use HTML `<details><summary>Question text</summary>Answer here</details>` for each Q&A pair.
## Further Reading

ADDITIONAL RULES:
- Wrap key insight callouts like: `> 💡 **Key Insight:** your insight here`
- Wrap common mistake callouts like: `> ⚠️ **Common Mistake:** your mistake here`
- Wrap tip callouts like: `> 🔵 **Tip:** your tip here`
- For code, always use properly fenced code blocks with the language specified, e.g. ```python
- For math formulas, use inline backticks or LaTeX-style notation.
- Ensure the Practice Questions section has at least 5 questions with detailed answers inside <details> tags.
- Do NOT skip sections; write "N/A" if a section genuinely does not apply.
"""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json(force=True)
        level = (data.get("level") or "").strip().lower()
        domain = (data.get("domain") or "").strip().lower()
        topic = (data.get("topic") or "").strip()
        depth = (data.get("depth") or "").strip().lower()

        missing = [f for f, v in {"level": level, "domain": domain, "topic": topic, "depth": depth}.items() if not v]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        system_prompt = build_system_prompt(level, domain, depth)

        response = get_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate comprehensive notes on the topic: {topic}"},
            ],
            temperature=0.7,
            max_tokens=4096,
        )

        notes = response.choices[0].message.content
        return jsonify({"notes": notes})

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/followup", methods=["POST"])
def followup():
    try:
        data = request.get_json(force=True)
        question = (data.get("question") or "").strip()
        topic = (data.get("topic") or "").strip()
        level = (data.get("level") or "").strip().lower()
        domain = (data.get("domain") or "").strip().lower()
        history = data.get("history") or []

        if not question:
            return jsonify({"error": "Missing follow-up question"}), 400

        level_inst = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["college"])
        system_content = (
            f"You are NoteVerse AI. The student is studying '{topic}' in the domain of '{domain}'. "
            f"{level_inst} "
            "Answer follow-up questions clearly, using Markdown formatting. "
            "Keep answers focused, well-structured, and appropriately detailed."
        )

        messages = [{"role": "system", "content": system_content}]

        for turn in history[-4:]:
            if turn.get("role") in ("user", "assistant") and turn.get("content"):
                messages.append({"role": turn["role"], "content": turn["content"]})

        messages.append({"role": "user", "content": question})

        response = get_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )

        answer = response.choices[0].message.content
        return jsonify({"answer": answer})

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, port=5000)
