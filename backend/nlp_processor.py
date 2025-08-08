import spacy

nlp = spacy.load("en_core_web_sm")

def extract_mindmap(text):
    doc = nlp(text)
    nodes = set()
    edges = []

    for chunk in doc.noun_chunks:
        nodes.add(chunk.text.strip())

    for token in doc:
        if token.dep_ == "ROOT" or token.pos_ == "VERB":
            subjects = [w for w in token.lefts if w.dep_ in ("nsubj", "nsubjpass")]
            objects = [w for w in token.rights if w.dep_ in ("dobj", "pobj")]

            if subjects and objects:
                src = subjects[0].text.strip()
                tgt = objects[0].text.strip()
                relation = token.lemma_

                edges.append({
                    "source": src,
                    "target": tgt,
                    "label": relation
                })

                nodes.update([src, tgt])

    return {
        "nodes": [{"id": node} for node in nodes],
        "edges": edges
    }
