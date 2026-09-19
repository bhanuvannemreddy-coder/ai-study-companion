from app.models.concept_mastery import ConceptMastery


def build_recommendations(
    mastery_records: list[ConceptMastery],
) -> list[dict]:
    recommendations = []

    if not mastery_records:
        return [
            {
                "type": "assessment",
                "title": "Take your first quiz",
                "reason": (
                    "There is not enough assessment evidence "
                    "yet to estimate concept mastery."
                ),
                "action": (
                    "Complete a short quiz to establish "
                    "your initial learning state."
                ),
                "concept": None,
                "priority": "high",
            }
        ]

    attention_concepts = [
        item
        for item in mastery_records
        if item.mastery_score < 50
        or item.trend == "needs_attention"
    ]

    improving_concepts = [
        item
        for item in mastery_records
        if item.trend == "improving"
    ]

    for item in attention_concepts[:3]:
        recommendations.append(
            {
                "type": "review",
                "title": f"Review {item.concept}",
                "reason": (
                    f"Current estimated mastery is "
                    f"{item.mastery_score:.0f}% and this "
                    f"concept needs more evidence."
                ),
                "action": (
                    "Ask the Tutor for a simpler explanation "
                    "and then take another targeted quiz."
                ),
                "concept": item.concept,
                "priority": "high",
            }
        )

    for item in improving_concepts[:2]:
        recommendations.append(
            {
                "type": "practice",
                "title": f"Strengthen {item.concept}",
                "reason": (
                    f"Your recent evidence shows improvement "
                    f"and this concept can benefit from "
                    f"additional practice."
                ),
                "action": (
                    "Try application-based questions on "
                    "this concept."
                ),
                "concept": item.concept,
                "priority": "medium",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "type": "assessment",
                "title": "Challenge your understanding",
                "reason": (
                    "Current concept mastery is relatively "
                    "stable across the available evidence."
                ),
                "action": (
                    "Take another quiz with a different "
                    "question focus."
                ),
                "concept": None,
                "priority": "medium",
            }
        )

    return recommendations