import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from app.database import AsyncSessionLocal, engine, Base
from app.models import User, Room, RoomMember, Task, ImportantNote, Achievement, TimelineEvent, AuditLog
from app.auth import get_password_hash

def utc_now():
    return datetime.now(timezone.utc)

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        if res.scalars().first():
            return

        print("Seeding PulseForge initial users, rooms, tasks, pins, and milestones...")

        # 1. Create Core Users
        password_hash = get_password_hash("hackathon123")
        now = utc_now()

        alex = User(
            name="Alex Rivera",
            email="alex@pulseforge.dev",
            hashed_password=password_hash,
            role_title="Principal Architect & Lead",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            skills=["Python", "FastAPI", "React", "Distributed Systems", "SQLAlchemy"],
            bio="Building high-velocity developer tools. 4x Hackathon Winner. Ex-Stripe.",
            created_at=now - timedelta(days=2)
        )
        sophia = User(
            name="Sophia Chen",
            email="sophia@pulseforge.dev",
            hashed_password=password_hash,
            role_title="AI/ML Engineer",
            avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
            skills=["PyTorch", "Gemini 1.5", "LangChain", "Vector Search", "Python"],
            bio="Specializing in multi-modal LLM reasoning and real-time streaming interfaces.",
            created_at=now - timedelta(days=2)
        )
        marcus = User(
            name="Marcus Vance",
            email="marcus@pulseforge.dev",
            hashed_password=password_hash,
            role_title="Product Designer & Frontend",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
            skills=["UI/UX", "Tailwind CSS", "React", "Figma", "Micro-interactions"],
            bio="Obsessed with dark-mode aesthetic design systems, typography, and crisp UX.",
            created_at=now - timedelta(days=2)
        )
        elena = User(
            name="Elena Rostova",
            email="elena@pulseforge.dev",
            hashed_password=password_hash,
            role_title="Full-Stack & DevOps",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
            skills=["Docker", "PostgreSQL", "WebSockets", "Terraform", "FastAPI"],
            bio="Keeping the cluster up and the latency sub-50ms under heavy demo load.",
            created_at=now - timedelta(days=2)
        )

        db.add_all([alex, sophia, marcus, elena])
        await db.flush()

        # 2. Create Room 1: HackZurich 2026 AI War Room
        room1 = Room(
            name="AI War Room — HackZurich 2026",
            slug="hackzurich-2026-ai",
            mission_statement="Ship an autonomous multi-modal agent workspace within 36 hours and win Best Overall AI Project.",
            created_by=alex.id,
            created_at=now - timedelta(hours=28)
        )
        db.add(room1)
        await db.flush()

        # Memberships for Room 1
        db.add_all([
            RoomMember(room_id=room1.id, user_id=alex.id, role="owner", joined_at=now - timedelta(hours=28)),
            RoomMember(room_id=room1.id, user_id=sophia.id, role="admin", joined_at=now - timedelta(hours=28)),
            RoomMember(room_id=room1.id, user_id=marcus.id, role="member", joined_at=now - timedelta(hours=27)),
            RoomMember(room_id=room1.id, user_id=elena.id, role="member", joined_at=now - timedelta(hours=27)),
        ])

        # Room 1 Tasks
        tasks_room1 = [
            # Done
            Task(
                room_id=room1.id,
                title="Draft Technical Specification & Architecture RFC",
                description="Finalized API endpoints, data flow diagram, and database model contracts.",
                status="done",
                priority="urgent",
                assigned_to=alex.id,
                due_date=now - timedelta(hours=20),
                created_at=now - timedelta(hours=26)
            ),
            Task(
                room_id=room1.id,
                title="Set up Vite + Tailwind UI boilerplate & dark theme tokens",
                description="Configured colors, Lucide icons, TanStack Query, and base layout.",
                status="done",
                priority="high",
                assigned_to=marcus.id,
                due_date=now - timedelta(hours=18),
                created_at=now - timedelta(hours=25)
            ),
            Task(
                room_id=room1.id,
                title="Benchmark Gemini 1.5 Pro vs Flash streaming latency",
                description="Flash clocked in at 140ms first-token latency; optimal for interactive agent actions.",
                status="done",
                priority="high",
                assigned_to=sophia.id,
                due_date=now - timedelta(hours=16),
                created_at=now - timedelta(hours=24)
            ),
            # In Progress
            Task(
                room_id=room1.id,
                title="Implement real-time agent workflow execution graph",
                description="Visual step-by-step progress nodes with live status indicators and error retries.",
                status="in_progress",
                priority="urgent",
                assigned_to=alex.id,
                due_date=now + timedelta(hours=3),
                created_at=now - timedelta(hours=12)
            ),
            Task(
                room_id=room1.id,
                title="Build War-Room countdown clock & timeline view",
                description="Ticking countdown to submission deadline with split view for active checkpoints and retro history.",
                status="in_progress",
                priority="high",
                assigned_to=marcus.id,
                due_date=now + timedelta(hours=2),
                created_at=now - timedelta(hours=10)
            ),
            Task(
                room_id=room1.id,
                title="Optimize audio and image payload chunking",
                description="Ensure base64 streams don't choke WebSocket frames during multimodal inference.",
                status="in_progress",
                priority="medium",
                assigned_to=elena.id,
                due_date=now + timedelta(hours=4),
                created_at=now - timedelta(hours=8)
            ),
            # Review
            Task(
                room_id=room1.id,
                title="Interactive pitch deck demo slides & slide deck export",
                description="Drafted 8 slides covering problem, agent architecture, metrics, and live demo hook.",
                status="review",
                priority="high",
                assigned_to=marcus.id,
                due_date=now + timedelta(hours=1),
                created_at=now - timedelta(hours=14)
            ),
            Task(
                room_id=room1.id,
                title="Docker compose staging environment on Railway",
                description="Healthcheck endpoint verified; CORS configured for staging URL.",
                status="review",
                priority="medium",
                assigned_to=elena.id,
                due_date=now + timedelta(hours=2),
                created_at=now - timedelta(hours=6)
            ),
            # Backlog
            Task(
                room_id=room1.id,
                title="Prepare Devpost demo video recording script (3 mins max)",
                description="Hook in first 10 seconds: show war-room countdown, live task status change, and trophy unlock.",
                status="backlog",
                priority="urgent",
                assigned_to=alex.id,
                due_date=now + timedelta(hours=5),
                created_at=now - timedelta(hours=5)
            ),
            Task(
                room_id=room1.id,
                title="Edge-case stress testing with 50 concurrent requests",
                description="Simulate judge swarm hitting API simultaneously.",
                status="backlog",
                priority="medium",
                assigned_to=sophia.id,
                due_date=now + timedelta(hours=6),
                created_at=now - timedelta(hours=4)
            ),
            Task(
                room_id=room1.id,
                title="Write judge evaluation cheat sheet & 1-page handout",
                description="Highlight key technical innovations: async SQLAlchemy, sub-second latency, dark mode UX.",
                status="backlog",
                priority="low",
                assigned_to=None,
                due_date=now + timedelta(hours=7),
                created_at=now - timedelta(hours=3)
            )
        ]
        db.add_all(tasks_room1)

        # Room 1 Important Notes
        notes_room1 = [
            ImportantNote(
                room_id=room1.id,
                title="Devpost Submission Portal",
                content_type="link",
                content="https://devpost.com/software/pulseforge-ai-war-room",
                is_pinned=True,
                created_by=alex.id,
                created_at=now - timedelta(hours=24)
            ),
            ImportantNote(
                room_id=room1.id,
                title="Figma High-Fidelity UI Prototype & Design System",
                content_type="link",
                content="https://figma.com/file/pulseforge-hackzurich-war-room",
                is_pinned=True,
                created_by=marcus.id,
                created_at=now - timedelta(hours=22)
            ),
            ImportantNote(
                room_id=room1.id,
                title="Staging Credentials & API Endpoints",
                content_type="snippet",
                content="VITE_API_URL=http://localhost:8000\nGEMINI_API_KEY=AIzaSy_PulseForgeHackDemo_Secret991\nRAILWAY_STAGING=https://pulseforge-api.up.railway.app",
                is_pinned=True,
                created_by=elena.id,
                created_at=now - timedelta(hours=18)
            ),
            ImportantNote(
                room_id=room1.id,
                title="60-Second Demo Pitch Cheat Sheet",
                content_type="markdown",
                content="### Winning Pitch Elevator:\n1. **The Hook:** In 36-hour hackathons, teams waste hours coordinating across fragmented tools.\n2. **The PulseForge Solution:** A single war-room with live ticking countdowns, pinned API vault, and trophy case.\n3. **Trophy Metric:** Tested with 4 teams today; slashed triage time from 25 min to instant.",
                is_pinned=False,
                created_by=sophia.id,
                created_at=now - timedelta(hours=14)
            )
        ]
        db.add_all(notes_room1)

        # Room 1 Achievements
        achievements_room1 = [
            Achievement(
                room_id=room1.id,
                title="MVP Core Engine Live in <6 Hours!",
                impact_note="FastAPI async backend deployed with zero runtime errors and sub-50ms latency.",
                is_starred=True,
                achieved_at=now - timedelta(hours=22),
                celebrated_by=alex.id
            ),
            Achievement(
                room_id=room1.id,
                title="Passed Mentor Review with 10/10 Score",
                impact_note="Lead judge from Google Cloud called our war-room architecture 'the cleanest hackathon dashboard we've seen.'",
                is_starred=True,
                achieved_at=now - timedelta(hours=12),
                celebrated_by=sophia.id
            ),
            Achievement(
                room_id=room1.id,
                title="50 Concurrent Mock Judge Stress Tests Passed",
                impact_note="Zero dropped sessions, memory consumption steady at 45MB.",
                is_starred=True,
                achieved_at=now - timedelta(hours=4),
                celebrated_by=elena.id
            )
        ]
        db.add_all(achievements_room1)

        # Room 1 Timeline Events
        timeline_room1 = [
            TimelineEvent(
                room_id=room1.id,
                event_name="Hacking Commences & Team Sync",
                target_time=now - timedelta(hours=28),
                status="completed",
                owner_id=alex.id,
                created_at=now - timedelta(hours=28)
            ),
            TimelineEvent(
                room_id=room1.id,
                event_name="Mentor Review #1 (Technical Architecture Check)",
                target_time=now - timedelta(hours=12),
                status="completed",
                owner_id=sophia.id,
                created_at=now - timedelta(hours=20)
            ),
            TimelineEvent(
                room_id=room1.id,
                event_name="Internal Code Freeze & Video Polish",
                target_time=now + timedelta(hours=3, minutes=30),
                status="pending",
                owner_id=alex.id,
                created_at=now - timedelta(hours=15)
            ),
            TimelineEvent(
                room_id=room1.id,
                event_name="Live Stage Dry Run & Screen Check",
                target_time=now + timedelta(hours=6),
                status="pending",
                owner_id=marcus.id,
                created_at=now - timedelta(hours=10)
            ),
            TimelineEvent(
                room_id=room1.id,
                event_name="Final Devpost Submission Deadline",
                target_time=now + timedelta(hours=8, minutes=45),
                status="pending",
                owner_id=alex.id,
                created_at=now - timedelta(hours=10)
            )
        ]
        db.add_all(timeline_room1)

        # Room 1 Retrospective Audit Logs
        logs_room1 = [
            AuditLog(
                room_id=room1.id,
                action_type="room_created",
                description="Alex Rivera created the war room 'AI War Room — HackZurich 2026'.",
                metadata_json={"slug": "hackzurich-2026-ai"},
                timestamp=now - timedelta(hours=28)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="member_joined",
                description="Sophia Chen, Marcus Vance, and Elena Rostova joined the war room.",
                metadata_json={"roles": ["admin", "member", "member"]},
                timestamp=now - timedelta(hours=27, minutes=30)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="task_completed",
                description="🎯 Alex Rivera marked task 'Draft Technical Specification & Architecture RFC' as COMPLETED!",
                metadata_json={"task": "Architecture RFC"},
                timestamp=now - timedelta(hours=20)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="achievement_unlocked",
                description="🏆 TROPHY UNLOCKED: 'MVP Core Engine Live in <6 Hours!' celebrated by Alex Rivera!",
                metadata_json={"achievement": "MVP Core Engine Live"},
                timestamp=now - timedelta(hours=22)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="milestone_reached",
                description="✅ MILESTONE REACHED: 'Mentor Review #1' marked completed by Sophia Chen!",
                metadata_json={"mentor_rating": "10/10"},
                timestamp=now - timedelta(hours=12)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="manual_retro",
                description="📝 [Sophia Chen]: Mentor feedback: Focus heavily on the live interactive UI during the 3-minute pitch; keep slides under 45 seconds.",
                metadata_json={"author": "Sophia Chen"},
                timestamp=now - timedelta(hours=11)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="note_pinned",
                description="📌 Elena Rostova pinned 'Staging Credentials & API Endpoints' (snippet).",
                metadata_json={"type": "snippet"},
                timestamp=now - timedelta(hours=9)
            ),
            AuditLog(
                room_id=room1.id,
                action_type="achievement_unlocked",
                description="🏆 TROPHY UNLOCKED: '50 Concurrent Mock Judge Stress Tests Passed' celebrated by Elena Rostova!",
                metadata_json={"latency": "sub-50ms"},
                timestamp=now - timedelta(hours=4)
            )
        ]
        db.add_all(logs_room1)

        # 3. Create Room 2: PulseForge Alpha - YC S26 Sprint (to show multi-room switching)
        room2 = Room(
            name="PulseForge Alpha — YC S26 Sprint",
            slug="pulseforge-yc-s26",
            mission_statement="Accelerate user onboarding for 10 high-growth startup teams in 14 days.",
            created_by=alex.id,
            created_at=now - timedelta(days=1)
        )
        db.add(room2)
        await db.flush()

        db.add_all([
            RoomMember(room_id=room2.id, user_id=alex.id, role="owner", joined_at=now - timedelta(days=1)),
            RoomMember(room_id=room2.id, user_id=sophia.id, role="member", joined_at=now - timedelta(days=1)),
        ])

        db.add_all([
            Task(
                room_id=room2.id,
                title="Conduct user interview with YC batchmate",
                description="Review dashboard workflow with 3 founder teams.",
                status="in_progress",
                priority="high",
                assigned_to=alex.id,
                due_date=now + timedelta(days=2),
                created_at=now - timedelta(days=1)
            ),
            Task(
                room_id=room2.id,
                title="Design customizable alert thresholds",
                description="Allow teams to sound alert bells when countdown hits 1 hour.",
                status="backlog",
                priority="medium",
                assigned_to=None,
                due_date=now + timedelta(days=4),
                created_at=now - timedelta(days=1)
            ),
            ImportantNote(
                room_id=room2.id,
                title="YC Application Video Draft",
                content_type="link",
                content="https://loom.com/share/pulseforge-yc-founder-video",
                is_pinned=True,
                created_by=alex.id,
                created_at=now - timedelta(hours=10)
            ),
            Achievement(
                room_id=room2.id,
                title="First 3 Beta Teams Actively Tracking Sprints",
                impact_note="Teams recorded 84 tasks and 12 achievements within 48 hours.",
                is_starred=True,
                achieved_at=now - timedelta(hours=6),
                celebrated_by=alex.id
            ),
            TimelineEvent(
                room_id=room2.id,
                event_name="YC Partner Mock Pitch",
                target_time=now + timedelta(days=3),
                status="pending",
                owner_id=alex.id,
                created_at=now - timedelta(hours=8)
            ),
            AuditLog(
                room_id=room2.id,
                action_type="room_created",
                description="Alex Rivera created war room 'PulseForge Alpha — YC S26 Sprint'.",
                metadata_json={"slug": "pulseforge-yc-s26"},
                timestamp=now - timedelta(days=1)
            )
        ])

        await db.commit()
        print("PulseForge database seed completed successfully!")

if __name__ == "__main__":
    async def main():
        try:
            await seed_data()
        finally:
            await engine.dispose()
    asyncio.run(main())
