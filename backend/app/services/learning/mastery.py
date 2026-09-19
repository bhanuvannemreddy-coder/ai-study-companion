from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.concept_mastery import ConceptMastery
from app.models.mastery_snapshot import MasterySnapshot
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_question import QuizQuestion


def get_trend(
    previous_score: float | None,
    new_score: float,
) -> str:
    if previous_score is None:
        if new_score < 50:
            return "needs_attention"

        return "stable"

    delta = new_score - previous_score

    if delta >= 5:
        return "improving"

    if delta <= -5 or new_score < 50:
        return "needs_attention"

    return "stable"


def update_mastery_for_attempt(
    db: Session,
    attempt: QuizAttempt,
) -> list[ConceptMastery]:
    existing_snapshots = (
        db.query(MasterySnapshot)
        .filter(
            MasterySnapshot.attempt_id == attempt.id
        )
        .count()
    )

    # Idempotency:
    # don't apply the same quiz evidence twice.
    if existing_snapshots > 0:
        return (
            db.query(ConceptMastery)
            .filter(
                ConceptMastery.project_id
                == attempt.project_id
            )
            .order_by(
                ConceptMastery.mastery_score.asc()
            )
            .all()
        )

    rows = (
        db.query(
            QuizQuestion.concept,
            QuizAnswer.score,
        )
        .join(
            QuizAnswer,
            QuizAnswer.question_id
            == QuizQuestion.id,
        )
        .filter(
            QuizQuestion.attempt_id == attempt.id,
            QuizAnswer.attempt_id == attempt.id,
        )
        .all()
    )

    concept_scores = defaultdict(list)

    for concept, score in rows:
        if not concept:
            continue

        concept_scores[concept].append(
            float(score or 0.0)
        )

    updated_mastery = []

    for concept, scores in concept_scores.items():

        quiz_score = (
            sum(scores)
            / len(scores)
            * 100
        )

        record = (
            db.query(ConceptMastery)
            .filter(
                ConceptMastery.project_id
                == attempt.project_id,
                ConceptMastery.concept == concept,
            )
            .first()
        )

        if record is None:

            previous_score = None
            new_score = round(
                quiz_score,
                2,
            )

            evidence_count = len(scores)

            record = ConceptMastery(
                project_id=attempt.project_id,
                concept=concept,
                mastery_score=new_score,
                previous_score=previous_score,
                evidence_count=evidence_count,
                trend=get_trend(
                    previous_score,
                    new_score,
                ),
            )

            db.add(record)

        else:

            previous_score = record.mastery_score

            # Give recent evidence 35% weight.
            # Keep the previous state at 65%.
            new_score = round(
                (
                    previous_score * 0.65
                    + quiz_score * 0.35
                ),
                2,
            )

            evidence_count = (
                record.evidence_count
                + len(scores)
            )

            record.previous_score = previous_score
            record.mastery_score = new_score
            record.evidence_count = evidence_count
            record.trend = get_trend(
                previous_score,
                new_score,
            )

        previous_for_snapshot = (
            None
            if record.previous_score is None
            else record.previous_score
        )

        snapshot_delta = (
            record.mastery_score
            if previous_for_snapshot is None
            else record.mastery_score
            - previous_for_snapshot
        )

        db.add(
            MasterySnapshot(
                project_id=attempt.project_id,
                attempt_id=attempt.id,
                concept=concept,
                previous_score=previous_for_snapshot,
                new_score=record.mastery_score,
                delta=round(
                    snapshot_delta,
                    2,
                ),
            )
        )

        updated_mastery.append(record)

    db.commit()

    for record in updated_mastery:
        db.refresh(record)

    return updated_mastery


def get_project_mastery(
    db: Session,
    project_id: int,
) -> list[ConceptMastery]:
    return (
        db.query(ConceptMastery)
        .filter(
            ConceptMastery.project_id == project_id
        )
        .order_by(
            ConceptMastery.mastery_score.asc()
        )
        .all()
    )