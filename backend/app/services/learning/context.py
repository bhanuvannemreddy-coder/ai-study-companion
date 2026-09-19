from collections import Counter

from sqlalchemy.orm import Session

from app.models.concept_mastery import ConceptMastery
from app.models.learning_context import LearningContext
from app.models.project import Project
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_question import QuizQuestion


def get_or_create_context(
    db: Session,
    user_id: int,
    project_id: int,
) -> LearningContext:
    context = (
        db.query(LearningContext)
        .filter(
            LearningContext.user_id == user_id,
            LearningContext.project_id == project_id,
        )
        .first()
    )

    if context:
        return context

    project = (
        db.query(Project)
        .join(Project.space)
        .filter(
            Project.id == project_id,
        )
        .first()
    )

    learning_goal = project.learning_goal if project else None

    context = LearningContext(
        user_id=user_id,
        project_id=project_id,
        preferences={},
        strengths=[],
        weaknesses=[],
        repeated_mistakes=[],
        important_history=[
            {
                "type": "project_goal",
                "value": learning_goal,
            }
        ]
        if learning_goal
        else [],
        assessment_summary={},
        tutor_context=(
            f"Learning goal: {learning_goal}"
            if learning_goal
            else None
        ),
    )

    db.add(context)
    db.flush()

    return context


def refresh_learning_context(
    db: Session,
    user_id: int,
    project_id: int,
) -> LearningContext:
    context = get_or_create_context(
        db=db,
        user_id=user_id,
        project_id=project_id,
    )

    mastery_rows = (
        db.query(ConceptMastery)
        .filter(ConceptMastery.project_id == project_id)
        .order_by(ConceptMastery.mastery_score.desc())
        .all()
    )

    strengths = [
        {
            "concept": row.concept,
            "mastery_score": round(row.mastery_score, 2),
            "trend": row.trend,
        }
        for row in mastery_rows
        if row.mastery_score >= 70
    ][:5]

    weaknesses = [
        {
            "concept": row.concept,
            "mastery_score": round(row.mastery_score, 2),
            "trend": row.trend,
        }
        for row in sorted(
            mastery_rows,
            key=lambda item: item.mastery_score,
        )
        if row.mastery_score < 60
    ][:5]

    # Find repeated mistakes from recent incorrect answers.
    mistake_rows = (
        db.query(QuizQuestion.concept)
        .join(
            QuizAnswer,
            QuizAnswer.question_id == QuizQuestion.id,
        )
        .join(
            QuizAnswer.attempt,
        )
        .filter(
            QuizAnswer.attempt.has(
                project_id=project_id,
            ),
            QuizAnswer.is_correct.is_(False),
            QuizQuestion.concept.isnot(None),
        )
        .order_by(QuizAnswer.created_at.desc())
        .limit(50)
        .all()
    )

    mistake_counter = Counter(
        concept
        for (concept,) in mistake_rows
        if concept
    )

    repeated_mistakes = [
        {
            "concept": concept,
            "count": count,
        }
        for concept, count in mistake_counter.most_common(5)
        if count >= 2
    ]

    total_mastery = (
        sum(row.mastery_score for row in mastery_rows) / len(mastery_rows)
        if mastery_rows
        else 0
    )

    assessment_summary = {
        "concept_count": len(mastery_rows),
        "overall_mastery": round(total_mastery, 2),
        "strength_count": len(strengths),
        "weakness_count": len(weaknesses),
        "repeated_mistake_count": len(repeated_mistakes),
    }

    tutor_parts = []

    if strengths:
        tutor_parts.append(
            "Strengths: "
            + ", ".join(
                item["concept"]
                for item in strengths
            )
        )

    if weaknesses:
        tutor_parts.append(
            "Areas needing attention: "
            + ", ".join(
                item["concept"]
                for item in weaknesses
            )
        )

    if repeated_mistakes:
        tutor_parts.append(
            "Repeated mistakes: "
            + ", ".join(
                f'{item["concept"]} ({item["count"]} mistakes)'
                for item in repeated_mistakes
            )
        )

    tutor_context = "\n".join(tutor_parts) or (
        "No meaningful learning-pattern evidence is available yet."
    )

    context.strengths = strengths
    context.weaknesses = weaknesses
    context.repeated_mistakes = repeated_mistakes
    context.assessment_summary = assessment_summary
    context.tutor_context = tutor_context

    db.flush()

    return context


def get_tutor_context(
    db: Session,
    user_id: int,
    project_id: int,
) -> LearningContext:
    return get_or_create_context(
        db=db,
        user_id=user_id,
        project_id=project_id,
    )